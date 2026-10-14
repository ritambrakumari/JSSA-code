import express from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import Student from "../models/Student.js";
import {
  isValidEmail,
  isValidPhone,
  normalizePhone,
  isValidPassword,
} from "../utils/validation.js";
import { generateToken } from "../utils/jwt.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/students/register
 * Register new student (creates User + Student record)
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
    body("fullName")
      .notEmpty()
      .withMessage("Full name is required")
      .trim(),
    body("fatherName")
      .notEmpty()
      .withMessage("Father's name is required")
      .trim(),
    body("dateOfBirth")
      .notEmpty()
      .withMessage("Date of birth is required"),
    body("gender")
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),
    body("mobile")
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage("Mobile must be 10 digits"),
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

      const {
        email,
        phone,
        password,
        fullName,
        fatherName,
        motherName,
        dateOfBirth,
        gender,
        aadharNumber,
        address,
        state,
        district,
        pincode,
        education,
        course,
        enrollmentNumber,
        mobile,
        photo,
      } = req.body;

      // Must provide either email or phone
      const identifier = email || phone || mobile;
      if (!identifier) {
        return res.status(400).json({
          error: "Email, phone, or mobile number is required",
        });
      }

      // Use mobile if phone not provided
      const phoneToUse = phone || mobile;

      // Validate email if provided
      if (email && !isValidEmail(email)) {
        return res.status(400).json({
          error: "Invalid email format",
        });
      }

      // Validate and normalize phone if provided
      let normalizedPhone = null;
      if (phoneToUse) {
        if (!isValidPhone(phoneToUse)) {
          return res.status(400).json({
            error: "Invalid phone number. Must be 10 digits.",
          });
        }
        normalizedPhone = normalizePhone(phoneToUse);
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

      // Check if enrollment number already exists (if provided)
      if (enrollmentNumber) {
        const existingStudent = await Student.findOne({ enrollmentNumber });
        if (existingStudent) {
          return res.status(409).json({
            error: "Enrollment number already exists",
          });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user first
      const user = await User.create({
        email: email ? email.toLowerCase() : null,
        phone: normalizedPhone || null,
        password: hashedPassword,
        role: "applicant", // Students are applicants
      });

      // Create student record
      const student = await Student.create({
        userId: user._id,
        fullName,
        fatherName,
        motherName: motherName || null,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        aadharNumber: aadharNumber || null,
        address: address || null,
        state: state || null,
        district: district || null,
        pincode: pincode || null,
        education: education || null,
        course: course || null,
        enrollmentNumber: enrollmentNumber || null,
        photo: photo || null,
        status: "pending",
      });

      // Generate token
      const token = generateToken({
        id: user._id.toString(),
        email: user.email || user.phone,
        role: user.role,
      });

      // Return user and student data
      res.status(201).json({
        success: true,
        message: "Student registered successfully",
        data: {
          user: {
            id: user._id,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          student: {
            id: student._id,
            fullName: student.fullName,
            enrollmentNumber: student.enrollmentNumber,
            status: student.status,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Student registration error:", error);

      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
          error: "Duplicate entry",
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
        error: "Student registration failed",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/students
 * Get all students (requires authentication)
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { enrollmentNumber: { $regex: search, $options: "i" } },
        { fatherName: { $regex: search, $options: "i" } },
      ];
    }

    // Role-based access: applicants can only see their own student record
    if (req.user.role === "applicant") {
      query.userId = req.user.id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const students = await Student.find(query)
      .populate("userId", "email phone role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      error: "Failed to fetch students",
      message: error.message,
    });
  }
});

/**
 * GET /api/students/:id
 * Get student by ID
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "userId",
      "email phone role"
    );

    if (!student) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    // Role-based access check
    if (
      req.user.role === "applicant" &&
      student.userId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only view your own student record",
      });
    }

    res.json({
      success: true,
      data: { student },
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      error: "Failed to fetch student",
      message: error.message,
    });
  }
});

/**
 * PUT /api/students/:id
 * Update student (requires authentication)
 */
router.put(
  "/:id",
  authenticate,
  [
    body("fullName").optional().notEmpty().trim(),
    body("fatherName").optional().notEmpty().trim(),
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

      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({
          error: "Student not found",
        });
      }

      // Role-based access check
      if (
        req.user.role === "applicant" &&
        student.userId.toString() !== req.user.id
      ) {
        return res.status(403).json({
          error: "Access denied",
          message: "You can only update your own student record",
        });
      }

      // Update student fields
      Object.assign(student, req.body);
      if (req.body.dateOfBirth) {
        student.dateOfBirth = new Date(req.body.dateOfBirth);
      }
      await student.save();

      res.json({
        success: true,
        message: "Student updated successfully",
        data: { student },
      });
    } catch (error) {
      console.error("Update student error:", error);
      res.status(500).json({
        error: "Failed to update student",
        message: error.message,
      });
    }
  }
);

export default router;
