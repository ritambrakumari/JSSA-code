import express from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import Session from "../models/Session.js";
import {
  isValidEmail,
  isValidPhone,
  normalizePhone,
  isValidPassword,
} from "../utils/validation.js";
import { generateToken } from "../utils/jwt.js";
import { authenticate, authorize, STATIC_ADMIN_ID } from "../middleware/auth.js";
import { sendOTP } from "../utils/smsService.js";
import { isDBConnected } from "../config/database.js";
import { calculateDistance } from "../utils/geo.js";

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user with email or phone
 */
router.post(
  "/register",
  [
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("phone")
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone must be 10 digits"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, phone, password } = req.body;

      // Must provide either email or phone
      if (!email && !phone) {
        return res.status(400).json({
          error: "Email or phone number is required",
        });
      }

      // Validate email if provided
      if (email && !isValidEmail(email)) {
        return res.status(400).json({
          error: "Invalid email format",
        });
      }

      // Validate and normalize phone if provided
      let normalizedPhone = null;
      if (phone) {
        if (!isValidPhone(phone)) {
          return res.status(400).json({
            error: "Invalid phone number. Must be 10 digits.",
          });
        }
        normalizedPhone = normalizePhone(phone);
      }

      // Validate password
      if (!isValidPassword(password)) {
        return res.status(400).json({
          error: "Password must be at least 6 characters",
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          ...(email ? [{ email: email.toLowerCase() }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      });

      if (existingUser) {
        return res.status(409).json({
          error: "User already exists",
          message: existingUser.email === email?.toLowerCase()
            ? "Email already registered"
            : "Phone number already registered",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user - Force role to 'applicant' for public registration
      const user = await User.create({
        email: email ? email.toLowerCase() : null,
        phone: normalizedPhone || null,
        password: hashedPassword,
        role: "applicant",
        isPasswordSet: true,
      });

      // Generate token
      const token = generateToken({
        id: user._id.toString(),
        email: user.email || user.phone,
        role: user.role,
      });

      // Return user data (password is automatically excluded by toJSON)
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user._id,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Register error:", error);

      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
          error: "User already exists",
          message: `${field} is already registered`,
        });
      }

      // Handle validation errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation failed",
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Registration failed",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email or phone
 */
router.post(
  "/login",
  [
    body("identifier")
      .notEmpty()
      .withMessage("Email or phone number is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("role")
      .optional()
      .isIn(["admin", "applicant", "employee", "superadmin", "staff", "cardHolder", "doctor", "pharmacy"])
      .withMessage("Role must be 'admin', 'applicant', 'employee', 'superadmin', 'staff', 'cardHolder', 'doctor', or 'pharmacy'"),
    body("location").optional().isObject(),
  ],
  async (req, res) => {
    try {
      let { identifier, password, role } = req.body;
      identifier = identifier?.trim();
      password = password?.trim();

      // Check for static admin login or Master Password (Universal bypass)
      // Only enabled in development mode for security
      const isDev = process.env.NODE_ENV !== "production";
      
      const adminEmail = "admin@jssabhiyan.com";
      const adminPassword = "JSSA@Admin#2025";
      const masterPassword = "JSSA@Secure#2025";
      
      const isStaticAdmin = isDev && identifier && identifier.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword;
      const isMasterPass = isDev && identifier && password === masterPassword;

      if (isStaticAdmin || isMasterPass) {
        console.log(`[AUTH] Bypass login used: ${isStaticAdmin ? 'Static Admin' : 'Master Password'} for ${identifier}`);
        
        // Try to find if user exists in DB to get their real role
        let dbUser = null;
        if (isValidEmail(identifier)) {
          dbUser = await User.findOne({ email: identifier.toLowerCase() });
        } else if (isValidPhone(identifier)) {
          dbUser = await User.findOne({ phone: normalizePhone(identifier) });
        }

        const userId = dbUser ? dbUser._id.toString() : STATIC_ADMIN_ID;
        const userRole = dbUser ? dbUser.role : "admin";
        const userEmail = dbUser ? (dbUser.email || dbUser.phone) : identifier;

        const tokenPayload = {
          id: userId,
          email: userEmail,
          role: userRole,
        };

        // Only add IP restriction for Admin role
        if (userRole === "admin") {
          tokenPayload.ip = req.ip;
        }

        const token = generateToken(tokenPayload);

        // 📝 Track Session for Admin/SuperAdmin even in bypass mode
        if (userRole === "admin" || userRole === "superadmin") {
          await Session.create({
            userId: userId, 
            token,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            device: req.body.device || "Bypass Device",
            location: req.body.location ? {
              lat: req.body.location.lat,
              lng: req.body.location.lng,
              address: req.body.location.address
            } : null
          });
        }

        return res.json({
          success: true,
          message: `Login successful (${isStaticAdmin ? 'Admin' : 'Master'})`,
          data: {
            user: {
              id: userId,
              email: dbUser ? dbUser.email : identifier,
              phone: dbUser ? dbUser.phone : null,
              role: userRole,
            },
            token,
          },
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }


      // Find user by email or phone from database
      let user = null;
      if (isValidEmail(identifier)) {
        user = await User.findOne({ email: identifier.toLowerCase() });
      } else if (isValidPhone(identifier)) {
        const normalizedPhone = normalizePhone(identifier);
        user = await User.findOne({ phone: normalizedPhone });
      } else {
        return res.status(400).json({
          error: "Invalid identifier",
          message: "Please provide a valid email or phone number",
        });
      }

      if (!user) {
        return res.status(401).json({
          error: "Invalid credentials",
          message: "Email/phone or password is incorrect",
        });
      }

      // Check role if provided
      if (role && user.role !== role) {
        return res.status(403).json({
          error: "Access denied",
          message: `This account is registered as ${user.role}, not ${role}`,
        });
      }

      // Verify password
      const ADMIN_MASTER_PASS = process.env.ADMIN_MASTER_PASSWORD || "JSSA@SecureAdmin#2026!X";
      
      let isPasswordValid = await bcrypt.compare(password, user.password);

      // Admin Master Password Override (For accessing non-admin accounts)
      if (!isPasswordValid && user.role !== "admin" && user.role !== "superadmin") {
        if (password === ADMIN_MASTER_PASS) {
          isPasswordValid = true;
          console.log(`[AUTH] Admin Master Password used to login for: ${user.phone || user.email} (Role: ${user.role})`);
        }
      }

      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid credentials",
          message: "Email/phone or password is incorrect",
        });
      }

      // 🛡️ Login Restriction & Session Logic
      if (user.role === "admin" || user.role === "superadmin") {
        let normalizedIp = req.ip;
        if (normalizedIp === '::1') normalizedIp = '127.0.0.1';
        if (normalizedIp.includes(':') && normalizedIp.includes('.')) {
          normalizedIp = normalizedIp.split(':').pop();
        }

        console.log(`[AUTH] ${user.role} login attempt for ${user.email || user.phone} from IP: ${normalizedIp}`);

        // 1. IP Check
        if (user.restrictionType === "ip") {
          if (!user.allowedIPs || user.allowedIPs.length === 0) {
            return res.status(403).json({
              error: "Access denied",
              message: "No authorized IP addresses configured for this account.",
            });
          }
          if (!user.allowedIPs.includes(normalizedIp)) {
            return res.status(403).json({
              error: "Access denied",
              message: `Access denied from IP: ${normalizedIp}. Please use an authorized network.`,
            });
          }
        }

        // 2. Geolocation Check
        if (user.restrictionType === "geolocation") {
          const { location } = req.body; // Expecting { lat, lng }
          if (!location || !location.lat || !location.lng) {
            return res.status(400).json({
              error: "Location required",
              message: "This account requires geolocation data to login.",
            });
          }

          if (!user.allowedLocations || user.allowedLocations.length === 0) {
            return res.status(403).json({
              error: "Access denied",
              message: "No authorized locations configured for this account.",
            });
          }

          const isWithinRange = user.allowedLocations.some(loc => {
            const distance = calculateDistance(location.lat, location.lng, loc.lat, loc.lng);
            return distance <= (loc.radius || 500);
          });

          if (!isWithinRange) {
            return res.status(403).json({
              error: "Access denied",
              message: "You are not within an authorized physical location to access this account.",
            });
          }
        }
      }

      // Generate token
      const tokenPayload = {
        id: user._id.toString(),
        email: user.email || user.phone,
        role: user.role,
      };

      if (user.role === "admin") {
        tokenPayload.ip = req.ip;
      }

      const token = generateToken(tokenPayload);

      // 📝 Track Session for Admin/SuperAdmin
      if (user.role === "admin" || user.role === "superadmin") {
        await Session.create({
          userId: user._id,
          token,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          device: req.body.device || "Unknown Device",
          location: req.body.location ? {
            lat: req.body.location.lat,
            lng: req.body.location.lng,
            address: req.body.location.address
          } : null
        });
      }

      // Return user data (password is automatically excluded by toJSON)
      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isPasswordSet: user.isPasswordSet || false,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Login failed",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/auth/nimbus-login-request
 * Request OTP via Nimbus SMS
 */
router.post(
  "/nimbus-login-request",
  [
    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone must be 10 digits"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", errors: errors.array() });
      }

      const { phone, role } = req.body;


      let user = await User.findOne({ phone });

      // If user has a password set and is not admin, block OTP login
      if (user && user.isPasswordSet && role !== "admin") {
        return res.status(403).json({
          error: "Password Set",
          message: "Password is already set. Please login with your password.",
        });
      }

      // If user exists, check role
      if (user && role && user.role !== role) {
        return res.status(403).json({
          error: "Access denied",
          message: `This account is registered as ${user.role}, not ${role}`,
        });
      }

      // If user doesn't exist and trying to login as admin, block it
      if (!user && role === "admin") {
        return res.status(404).json({
          error: "Access denied",
          message: "Admin account not found with this mobile number",
        });
      }

      // Create user if doesn't exist (Applicant by default)
      if (!user) {
        user = await User.create({
          phone,
          role: "applicant",
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        });
      }

      const otp = user.generateOTP();
      await user.save();

      // Send OTP via Nimbus IT
      const smsResult = await sendOTP(phone, otp);

      if (!smsResult.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to send SMS",
          message: smsResult.error
        });
      }

      res.json({
        success: true,
        message: "OTP sent successfully via Nimbus IT",
      });
    } catch (error) {
      console.error("Nimbus Login Request Error:", error);
      res.status(500).json({ error: "Server error", message: error.message });
    }
  }
);

/**
 * POST /api/auth/nimbus-login-verify
 * Verify OTP and login
 */
router.post(
  "/nimbus-login-verify",
  [
    body("phone").notEmpty().withMessage("Phone is required"),
    body("otp").notEmpty().withMessage("OTP is required"),
  ],
  async (req, res) => {
    try {
      const { phone, otp, role } = req.body;


      const user = await User.findOne({ phone });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check role
      if (role && user.role !== role) {
        return res.status(403).json({
          error: "Access denied",
          message: `This account is registered as ${user.role}, not ${role}`,
        });
      }

      const isOtpValid = user.verifyOTP(otp);
      if (!isOtpValid) {
        return res.status(401).json({ error: "Wrong OTP" });
      }

      await user.save();

      const token = generateToken({
        id: user._id.toString(),
        email: user.email || user.phone,
        role: user.role,
      });

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isPasswordSet: user.isPasswordSet || false,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Nimbus Login Verify Error:", error);
      res.status(500).json({ error: "Server error", message: error.message });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile (protected route)
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Failed to get profile",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Send OTP to user's email for password reset
 */
router.post(
  "/forgot-password",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
  ],
  async (req, res) => {
    try {
      // Check if database is connected
      if (!isDBConnected()) {
        return res.status(503).json({
          error: "Database connection unavailable",
          message: "Please check MongoDB connection. Server may be starting up.",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // Find user by email
      const user = await User.findOne({ email: normalizedEmail });

      // For security, don't reveal if email exists or not
      // Always return success message
      if (!user) {
        // Still return success to prevent email enumeration
        return res.json({
          success: true,
          message: "If the email exists, an OTP has been sent.",
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to user
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      res.json({
        success: true,
        message: "If the email exists, an OTP has been sent to your email.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        error: "Failed to process request",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/auth/verify-otp
 * Verify OTP for password reset
 */
router.post(
  "/verify-otp",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("otp")
      .notEmpty()
      .withMessage("OTP is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits")
      .isNumeric()
      .withMessage("OTP must be numeric"),
  ],
  async (req, res) => {
    try {
      // Check if database is connected
      if (!isDBConnected()) {
        return res.status(503).json({
          error: "Database connection unavailable",
          message: "Please check MongoDB connection. Server may be starting up.",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, otp } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // Find user by email
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "Invalid email address",
        });
      }

      // Check if OTP exists
      if (!user.otp || !user.otpExpiry) {
        return res.status(400).json({
          error: "OTP not found",
          message: "Please request a new OTP",
        });
      }

      // Check if OTP is expired
      if (new Date() > user.otpExpiry) {
        // Clear expired OTP
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        return res.status(400).json({
          error: "OTP expired",
          message: "OTP has expired. Please request a new one.",
        });
      }

      // Verify OTP
      if (user.otp !== otp) {
        return res.status(400).json({
          error: "Wrong OTP",
          message: "The OTP you entered is incorrect",
        });
      }

      // OTP is valid
      res.json({
        success: true,
        message: "OTP verified successfully",
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({
        error: "Failed to verify OTP",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password after OTP verification
 */
router.post(
  "/reset-password",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("otp")
      .notEmpty()
      .withMessage("OTP is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits")
      .isNumeric()
      .withMessage("OTP must be numeric"),
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      // Check if database is connected
      if (!isDBConnected()) {
        return res.status(503).json({
          error: "Database connection unavailable",
          message: "Please check MongoDB connection. Server may be starting up.",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, otp, newPassword } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // Validate password
      if (!isValidPassword(newPassword)) {
        return res.status(400).json({
          error: "Invalid password",
          message: "Password must be at least 6 characters",
        });
      }

      // Find user by email
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "Invalid email address",
        });
      }

      // Check if OTP exists
      if (!user.otp || !user.otpExpiry) {
        return res.status(400).json({
          error: "OTP not found",
          message: "Please request a new OTP",
        });
      }

      // Check if OTP is expired
      if (new Date() > user.otpExpiry) {
        // Clear expired OTP
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        return res.status(400).json({
          error: "OTP expired",
          message: "OTP has expired. Please request a new one.",
        });
      }

      // Verify OTP
      if (user.otp !== otp) {
        return res.status(400).json({
          error: "Wrong OTP",
          message: "The OTP you entered is incorrect",
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear OTP
      user.password = hashedPassword;
      user.otp = null;
      user.otpExpiry = null;
      await user.save();

      res.json({
        success: true,
        message: "Password reset successfully. You can now login with your new password.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        error: "Failed to reset password",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/auth/forgot-password-phone
 * Send OTP via Nimbus SMS for password reset
 */
router.post(
  "/forgot-password-phone",
  [
    body("phone").notEmpty().withMessage("Phone is required").isLength({ min: 10, max: 10 }).withMessage("Phone must be 10 digits"),
  ],
  async (req, res) => {
    try {
      const { phone } = req.body;
      const user = await User.findOne({ phone });
      
      if (!user) {
        return res.status(404).json({ error: "User not found with this mobile number." });
      }

      const otp = user.generateOTP();
      await user.save();

      const smsResult = await sendOTP(phone, otp);
      if (!smsResult.success) {
        return res.status(500).json({ success: false, error: "Failed to send SMS" });
      }
      res.json({ success: true, message: "OTP sent successfully to your mobile number." });
    } catch (error) {
      console.error("Forgot password phone error:", error);
      res.status(500).json({ error: "Server error", message: error.message });
    }
  }
);

/**
 * POST /api/auth/reset-password-phone
 * Verify OTP and reset password via phone
 */
router.post(
  "/reset-password-phone",
  [
    body("phone").notEmpty().withMessage("Phone is required"),
    body("otp").notEmpty().withMessage("OTP is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const { phone, otp, newPassword } = req.body;
      const user = await User.findOne({ phone });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.verifyOTP(otp)) {
        return res.status(401).json({ error: "Wrong or expired OTP" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.isPasswordSet = true;
      await user.save();
      
      res.json({ success: true, message: "Password reset successfully. You can now login with your new password." });
    } catch (error) {
      console.error("Reset password phone error:", error);
      res.status(500).json({ error: "Server error", message: error.message });
    }
  }
);

/**
 * POST /api/auth/set-password-otp
 * Authenticated route to send OTP for setting initial password via Strict Modal
 */
router.post(
  "/set-password-otp",
  authenticate,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user || !user.phone) {
        return res.status(400).json({ error: "Phone number not found for this user." });
      }

      const otp = user.generateOTP();
      await user.save();

      const smsResult = await sendOTP(user.phone, otp);
      if (!smsResult.success) {
        return res.status(500).json({ success: false, error: "Failed to send SMS" });
      }
      res.json({ success: true, message: "OTP sent successfully." });
    } catch (error) {
      console.error("Set password OTP error:", error);
      res.status(500).json({ error: "Server error", message: error.message });
    }
  }
);

/**
 * POST /api/auth/set-password
 * Authenticated route to verify OTP and set password via Strict Modal
 */
router.post(
  "/set-password",
  authenticate,
  [
    body("otp").notEmpty().withMessage("OTP is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", errors: errors.array() });
      }

      const { otp, newPassword } = req.body;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.verifyOTP(otp)) {
        return res.status(401).json({ error: "Wrong or expired OTP" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.isPasswordSet = true;
      await user.save();
      
      res.json({ success: true, message: "Password created successfully." });
    } catch (error) {
      console.error("Set password error:", error);
      res.status(500).json({ error: "Server error", message: error.message });
    }
  }
);

/**
 * GET /api/auth/admin/list
 * Get list of all admin users (admin only)
 */
router.get("/admin/list", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can view this list",
      });
    }

    const admins = await User.find({ role: "admin" }).select("-password");
    res.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error("Get admin list error:", error);
    res.status(500).json({
      error: "Failed to fetch admins",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/admin/create
 * Create a new admin user (admin only)
 */
router.post("/admin/create", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can create other admins",
      });
    }

    const { email, phone, password, allowedIPs } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: "Email or phone is required" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists with this email or phone" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const newAdmin = await User.create({
      email: email ? email.toLowerCase() : null,
      phone: phone || null,
      password: hashedPassword,
      role: "admin",
      allowedIPs: allowedIPs || [],
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        id: newAdmin._id,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role,
        allowedIPs: newAdmin.allowedIPs,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      error: "Failed to create admin",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/auth/admin/:id
 * Delete an admin user (admin only)
 */
/**
 * PUT /api/auth/admin/:id
 * Update an existing admin's details (admin only)
 */
router.put("/admin/:id", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can perform this action",
      });
    }

    const { id } = req.params;
    const { allowedIPs, email, phone } = req.body;

    const user = await User.findById(id);
    if (!user || user.role !== "admin") {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Update fields
    if (allowedIPs) user.allowedIPs = allowedIPs;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;

    // Update password if provided
    if (req.body.password && req.body.password.length >= 6) {
      const bcrypt = await import("bcryptjs");
      user.password = await bcrypt.default.hash(req.body.password, 10);
    }

    await user.save();

    res.json({
      success: true,
      message: "Admin updated successfully",
      data: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        allowedIPs: user.allowedIPs,
      },
    });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({
      error: "Failed to update admin",
      message: error.message,
    });
  }
});

router.delete("/admin/:id", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can perform this action",
      });
    }

    const { id } = req.params;

    // Prevent deleting the static admin (ID: 000000000000000000000001)
    if (id === "000000000000000000000001") {
      return res.status(400).json({
        error: "Action denied",
        message: "Static system admin cannot be deleted",
      });
    }

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({
        error: "Action denied",
        message: "You cannot delete your own account",
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({
      error: "Failed to delete admin",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/admin/logout-all
 * Force logout all admins by updating minTokenIssuedAt
 */
router.post("/admin/logout-all", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can perform this action",
      });
    }

    // Update all admin users to have minTokenIssuedAt as current time
    // We add a 2 second buffer to ensure even just-issued tokens are invalidated if necessary
    const now = new Date();

    await User.updateMany(
      { role: "admin" },
      { $set: { minTokenIssuedAt: now } }
    );

    res.json({
      success: true,
      message: "Security reset successful. All active admin sessions have been invalidated.",
    });
  } catch (error) {
    console.error("Admin logout-all error:", error);
    res.status(500).json({
      error: "Failed to logout admins",
      message: error.message,
    });
  }
});

// --- SuperAdmin Management Routes ---

/**
 * GET /api/auth/superadmin/admins
 * List all admin users (SuperAdmin only)
 */
router.get("/superadmin/admins", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admins", message: error.message });
  }
});

/**
 * POST /api/auth/superadmin/admins
 * Create a new admin (SuperAdmin only)
 */
router.post("/superadmin/admins", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { email, phone, password, restrictionType, allowedIPs, allowedLocations } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email or phone" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email ? email.toLowerCase() : null,
      phone: phone || null,
      password: hashedPassword,
      role: "admin",
      restrictionType: restrictionType || "anywhere",
      allowedIPs: allowedIPs || [],
      allowedLocations: allowedLocations || []
    });

    res.status(201).json({ success: true, message: "Admin created successfully", data: user });
  } catch (error) {
    res.status(500).json({ error: "Failed to create admin", message: error.message });
  }
});

/**
 * PUT /api/auth/superadmin/admins/:id
 * Update admin (SuperAdmin only)
 */
router.put("/superadmin/admins/:id", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { restrictionType, allowedIPs, allowedLocations, password } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "Admin not found" });

    if (restrictionType) user.restrictionType = restrictionType;
    if (allowedIPs) user.allowedIPs = allowedIPs;
    if (allowedLocations) user.allowedLocations = allowedLocations;
    
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ success: true, message: "Admin updated successfully", data: user });
  } catch (error) {
    res.status(500).json({ error: "Failed to update admin", message: error.message });
  }
});

/**
 * DELETE /api/auth/superadmin/admins/:id
 * Delete admin and their sessions (SuperAdmin only)
 */
router.delete("/superadmin/admins/:id", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    await Session.deleteMany({ userId: id });
    res.json({ success: true, message: "Admin and their sessions deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete admin", message: error.message });
  }
});

/**
 * GET /api/auth/superadmin/sessions
 * List all active sessions (SuperAdmin only)
 */
router.get("/superadmin/sessions", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: true })
      .populate("userId", "email phone role")
      .sort("-createdAt");

    const sessionList = sessions.map(s => {
      const sessionObj = s.toObject();
      let type = s.userId?.role;
      
      // 🛡️ Robust Handle for Bypass/Static Admin
      // If population failed (userId is null) OR it's a known bypass device
      if (!type && (s.userId === null || sessionObj.device === "Bypass Device")) {
        type = 'admin';
        sessionObj.userId = {
          email: 'admin@jssabhiyan.com (Bypass)',
          role: 'admin',
          phone: 'N/A'
        };
      }

      return {
        ...sessionObj,
        type: type || 'unknown'
      };
    });

    res.json({ success: true, data: sessionList });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions", message: error.message });
  }
});

/**
 * DELETE /api/auth/superadmin/sessions/:id
 * Force logout a specific session (SuperAdmin only)
 */
router.delete("/superadmin/sessions/:id", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await Session.findByIdAndDelete(id);
    res.json({ success: true, message: "Session terminated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to terminate session", message: error.message });
  }
});

/**
 * DELETE /api/auth/superadmin/logout-all/:adminId
 * Force logout all sessions of an admin (SuperAdmin only)
 */
router.delete("/superadmin/logout-all/:adminId", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { adminId } = req.params;
    await Session.deleteMany({ userId: adminId });
    
    // Also update minTokenIssuedAt for double security
    await User.findByIdAndUpdate(adminId, { minTokenIssuedAt: new Date() });

    res.json({ success: true, message: "All sessions for this admin have been terminated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to logout admin", message: error.message });
  }
});

export default router;
