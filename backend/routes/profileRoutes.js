import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import AdministrativeStaff from "../models/AdministrativeStaff.js";
import { authenticate } from "../middleware/auth.js";
import { isValidEmail, isValidPhone, normalizePhone } from "../utils/validation.js";

const router = express.Router();

// Ensure upload directory exists
const profilesDir = path.join(process.cwd(), "uploads", "profiles");
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `profile_${timestamp}${ext}`);
  }
});

const localUpload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const mimetype = allowed.test(file.mimetype);
    if (mimetype) cb(null, true);
    else cb(new Error("Only images are allowed"));
  }
});

// @desc    Check if email/phone is available (for real-time onChange)
// @route   POST /api/profile/check-availability
// @access  Private
router.post("/check-availability", authenticate, async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    // Check Email
    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ available: false, error: "Invalid email format" });
      }
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.json({ available: false, error: "This email is already registered." });
      }
    }

    // Check Phone
    if (phone) {
      if (!isValidPhone(phone)) {
        return res.status(400).json({ available: false, error: "Invalid phone format. Must be 10 digits." });
      }
      const normalizedPhone = normalizePhone(phone);
      const existingUser = await User.findOne({ phone: normalizedPhone });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.json({ available: false, error: "This mobile number is already registered." });
      }
    }

    return res.json({ available: true });
  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Edit Employee Profile Details
// @route   PUT /api/profile/employee/edit
// @access  Private
router.put("/employee/edit", authenticate, localUpload.fields([{ name: "photo", maxCount: 1 }, { name: "signature", maxCount: 1 }]), async (req, res) => {
  try {
    const { name, email, mobile, bankName, accountNumber, ifscCode, accountHolderName } = req.body;
    
    // Validate uniqueness first
    let normalizedPhone = mobile ? normalizePhone(mobile) : null;
    let normalizedEmail = email ? email.toLowerCase() : null;

    if (normalizedEmail) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ error: "Email is already registered by someone else." });
      }
    }

    if (normalizedPhone) {
      const existingUser = await User.findOne({ phone: normalizedPhone });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ error: "Mobile number is already registered by someone else." });
      }
    }

    // Find Employee and User
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User account not found" });
    }

    // Update Photo if uploaded
    let photoUrl = employee.photo;
    if (req.files && req.files.photo && req.files.photo[0]) {
      photoUrl = `/uploads/profiles/${req.files.photo[0].filename}`;
    }

    // Update Signature if uploaded
    let signatureUrl = employee.signature;
    if (req.files && req.files.signature && req.files.signature[0]) {
      signatureUrl = `/uploads/profiles/${req.files.signature[0].filename}`;
    }

    // Update User (Auth Sync)
    if (normalizedEmail) user.email = normalizedEmail;
    if (normalizedPhone) user.phone = normalizedPhone;
    if (name) user.name = name;
    if (photoUrl) user.photo = photoUrl;
    await user.save();

    // Update Employee
    if (name) employee.name = name;
    if (bankName) employee.bankName = bankName;
    if (accountNumber) employee.accountNumber = accountNumber;
    if (ifscCode) employee.ifscCode = ifscCode;
    if (accountHolderName) employee.accountHolderName = accountHolderName;
    if (photoUrl) employee.photo = photoUrl;
    if (signatureUrl) employee.signature = signatureUrl;
    
    // Update Education Details
    if (req.body.educationDetails) {
      try {
        const parsedEdu = JSON.parse(req.body.educationDetails);
        if (Array.isArray(parsedEdu)) {
          employee.educationDetails = parsedEdu;
        }
      } catch (e) {
        console.error("Failed to parse educationDetails:", e);
      }
    }

    await employee.save();

    res.json({
      success: true,
      message: "Profile updated successfully. Login details synced.",
      data: employee
    });
  } catch (error) {
    console.error("Employee Edit Error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// @desc    Edit Staff Profile Details
// @route   PUT /api/profile/staff/edit
// @access  Private
router.put("/staff/edit", authenticate, localUpload.fields([{ name: "photo", maxCount: 1 }, { name: "signature", maxCount: 1 }]), async (req, res) => {
  try {
    const { name, email, mobile, bankName, accountNumber, ifscCode, accountHolderName } = req.body;
    
    // Validate uniqueness first
    let normalizedPhone = mobile ? normalizePhone(mobile) : null;
    let normalizedEmail = email ? email.toLowerCase() : null;

    if (normalizedEmail) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ error: "Email is already registered by someone else." });
      }
    }

    if (normalizedPhone) {
      const existingUser = await User.findOne({ phone: normalizedPhone });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ error: "Mobile number is already registered by someone else." });
      }
    }

    // Find Staff and User
    const staff = await AdministrativeStaff.findOne({ userId: req.user.id });
    if (!staff) {
      return res.status(404).json({ error: "Staff profile not found" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User account not found" });
    }

    // Update Photo if uploaded
    let photoUrl = staff.photo;
    if (req.files && req.files.photo && req.files.photo[0]) {
      photoUrl = `/uploads/profiles/${req.files.photo[0].filename}`;
    }

    // Update Signature if uploaded
    let signatureUrl = staff.signature;
    if (req.files && req.files.signature && req.files.signature[0]) {
      signatureUrl = `/uploads/profiles/${req.files.signature[0].filename}`;
    }

    // Update User (Auth Sync)
    if (normalizedEmail) user.email = normalizedEmail;
    if (normalizedPhone) user.phone = normalizedPhone;
    if (name) user.name = name;
    if (photoUrl) user.photo = photoUrl;
    await user.save();

    // Update Staff
    if (name) staff.name = name;
    if (bankName) staff.bankName = bankName;
    if (accountNumber) staff.accountNumber = accountNumber;
    if (ifscCode) staff.ifscCode = ifscCode;
    if (accountHolderName) staff.accountHolderName = accountHolderName;
    if (photoUrl) staff.photo = photoUrl;
    if (signatureUrl) staff.signature = signatureUrl;
    await staff.save();

    res.json({
      success: true,
      message: "Profile updated successfully. Login details synced.",
      data: staff
    });
  } catch (error) {
    console.error("Staff Edit Error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
