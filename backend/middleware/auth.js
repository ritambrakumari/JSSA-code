import { verifyToken, extractToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Session from "../models/Session.js";

// Must be a valid 24-hex MongoDB ObjectId string so Mongoose can store it in ObjectId fields.
export const STATIC_ADMIN_ID = "000000000000000000000001";

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        message: "No token provided",
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: "Invalid token",
        message: "Token is expired or invalid",
      });
    }

    // Handle static admin user (support both old and new ID format)
    // We only provide a fallback if the database is somehow unreachable or user is missing
    if (decoded.id === STATIC_ADMIN_ID || decoded.id === "static_admin_001") {
      const user = await User.findById(STATIC_ADMIN_ID);
      if (!user) {
        // Fallback user object for static admin
        req.user = {
          id: STATIC_ADMIN_ID,
          email: decoded.email || "admin@jssabhiyan.com",
          phone: null,
          role: decoded.role || "admin",
        };
        // Do NOT return next() here. Let it fall through to the session check below.
      } else {
        // If static admin user exists in DB, populate req.user normally
        req.user = {
          id: user._id.toString(),
          email: user.email,
          phone: user.phone,
          role: user.role,
        };
      }
    } else {
      // Find user by ID from token (database users)
      // Only query database if it's a valid ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(decoded.id)) {
        return res.status(401).json({
          error: "Invalid user ID format",
          message: "Token contains invalid user ID",
        });
      }
      
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          error: "User not found",
          message: "Token is valid but user doesn't exist",
        });
      }

      // Attach user to request (password is automatically excluded by toJSON)
      req.user = {
        id: user._id.toString(),
        email: user.email,
        phone: user.phone,
        role: user.role,
      };
    }

    // 🛡️ Session Validation for Admins & SuperAdmins
    // If the session record is deleted from the database, the user must be logged out.
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      // For static admin, we check using STATIC_ADMIN_ID if req.user.id is used
      const activeSession = await Session.findOne({ token, userId: req.user.id });
      if (!activeSession) {
        return res.status(401).json({
          error: "Session terminated",
          message: "Your session has been terminated by an administrator. Please login again.",
          sessionTerminated: true
        });
      }
      
      // Update last active timestamp (background)
      activeSession.lastActive = new Date();
      activeSession.save().catch(err => console.error("Failed to update session lastActive:", err));
    }

    // Security Check: IP-based session validation for Admins
    // Only apply if the user is an admin and the token contains an IP
    if (req.user.role === "admin" && decoded.ip) {
      const currentIp = req.ip;
      
      // Basic IP comparison (ignoring IPv6/IPv4 prefix differences if possible)
      // Standardizing loopback for local testing
      const standardizeIp = (ip) => (ip === "::1" ? "127.0.0.1" : ip);
      
      if (standardizeIp(currentIp) !== standardizeIp(decoded.ip)) {
        console.warn(`[AUTH] Admin session blocked: IP mismatch. Original: ${decoded.ip}, Current: ${currentIp}`);
        return res.status(401).json({
          error: "Session security alert",
          message: "Network change detected. For security, please login again.",
          ipMismatch: true
        });
      }
    }

    // Check if token was issued before forced logout (Only for DB users who have minTokenIssuedAt)
    // We need to fetch the full user object if we want to check this property
    const dbUser = await User.findById(req.user.id);
    if (dbUser && dbUser.minTokenIssuedAt && decoded.iat) {
      const minIssuedAtTimestamp = Math.floor(dbUser.minTokenIssuedAt.getTime() / 1000);
      if (decoded.iat < minIssuedAtTimestamp) {
        return res.status(401).json({
          error: "Session expired",
          message: "A security reset was performed. Please login again.",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      error: "Authentication failed",
      message: error.message,
    });
  }
}

/**
 * Middleware to restrict access based on user roles
 * @param {string[]} roles Array of allowed roles (e.g., ['admin', 'employee'])
 */
export function authorize(...roles) {
  // Support both authorize(["admin"]) and authorize("admin", "superadmin")
  const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
}
