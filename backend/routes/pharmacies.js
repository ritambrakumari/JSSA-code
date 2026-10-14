import express from "express";
const router = express.Router();
import Pharmacy from "../models/Pharmacy.js";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import { normalizePhone } from "../utils/validation.js";
import PharmacyProduct from "../models/PharmacyProduct.js";
import PharmacyBill from "../models/PharmacyBill.js";
import Prescription from "../models/Prescription.js";
import DoctorToken from "../models/DoctorToken.js";

// @desc    Get all pharmacies (Admin)
// @route   GET /api/pharmacies
// @access  Private (Admin, Superadmin)
router.get("/", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find().populate("userId", "email phone role").sort({ createdAt: -1 });
    res.json({ success: true, pharmacies });
  } catch (error) {
    console.error("Get pharmacies error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Add new pharmacy (Admin)
// @route   POST /api/pharmacies
// @access  Private (Admin, Superadmin)
router.post("/", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const { name, mobile, email } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ error: "Name and Mobile number are required" });
    }

    const normalizedPhone = normalizePhone(mobile);
    const normalizedEmail = email ? email.toLowerCase() : null;

    // Check if user exists
    let existingUserQuery = [{ phone: normalizedPhone }];
    if (normalizedEmail) {
      existingUserQuery.push({ email: normalizedEmail });
    }

    const existingUser = await User.findOne({ $or: existingUserQuery });
    if (existingUser) {
      return res.status(400).json({ error: "Mobile number or email already registered" });
    }

    // Create User with default password
    const hashedPassword = await bcrypt.hash(normalizedPhone, 10);
    const newUser = new User({
      name,
      phone: normalizedPhone,
      email: normalizedEmail,
      password: hashedPassword,
      role: "pharmacy"
    });

    const savedUser = await newUser.save();

    // Create Pharmacy Record
    const newPharmacy = new Pharmacy({
      userId: savedUser._id,
      name,
      createdBy: req.user.id
    });

    await newPharmacy.save();

    res.status(201).json({ success: true, message: "Pharmacy added successfully", pharmacy: newPharmacy });
  } catch (error) {
    console.error("Add pharmacy error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Update pharmacy photo
// @route   PUT /api/pharmacies/photo
// @access  Private (Pharmacy)
router.put("/photo", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    const pharmacy = await Pharmacy.findOneAndUpdate(
      { userId: req.user.id },
      { image },
      { new: true }
    );

    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }

    res.json({ success: true, pharmacy });
  } catch (error) {
    console.error("Update pharmacy photo error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Get prescriptions for pharmacy (Pending, Completed, All)
// @route   GET /api/pharmacies/prescriptions
// @access  Private (Pharmacy)
router.get("/prescriptions", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ userId: req.user.id });
    if (!pharmacy) return res.status(404).json({ error: "Pharmacy not found" });

    const { status } = req.query; // all, pending, completed
    
    let filter = {};
    if (status === 'pending') {
      filter.status = "pending_pharmacy";
    } else if (status === 'completed') {
      filter.status = "dispensed";
      filter.pharmacyId = pharmacy._id; // Only show completed if dispensed by this pharmacy
    } else {
      // all
      filter.$or = [
        { status: "pending_pharmacy" },
        { status: "dispensed", pharmacyId: pharmacy._id }
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Prescription.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const prescriptions = await Prescription.find(filter)
      .populate("doctorId", "name specification clinicAddress image")
      .populate("cardholderId", "name phone age")
      .populate("tokenId", "tokenNumber")
      .populate("medicines.medicineId", "name type unit")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, prescriptions, pagination: { total, pages, page, limit } });
  } catch (error) {
    console.error("Get prescriptions error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Mark prescription as dispensed
// @route   PUT /api/pharmacies/prescriptions/:id/dispense
// @access  Private (Pharmacy)
router.put("/prescriptions/:id/dispense", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ userId: req.user.id });
    if (!pharmacy) return res.status(404).json({ error: "Pharmacy not found" });

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    if (prescription.status !== "pending_pharmacy") {
      return res.status(400).json({ error: "Prescription is not pending" });
    }

    // Update Prescription
    prescription.status = "dispensed";
    prescription.pharmacyId = pharmacy._id;
    await prescription.save();

    // Update Token
    const token = await DoctorToken.findById(prescription.tokenId);
    if (token) {
      token.status = "dispensed"; // or completed
      await token.save();
    }

    res.json({ success: true, prescription });
  } catch (error) {
    console.error("Dispense prescription error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Get Pharmacy Profile (Self)
// @route   GET /api/pharmacies/me
// @access  Private (Pharmacy)
router.get("/me", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ userId: req.user.id }).populate("userId", "email phone");
    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }
    res.json({ success: true, pharmacy });
  } catch (error) {
    console.error("Get pharmacy profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Get Dashboard Stats
// @route   GET /api/pharmacies/dashboard-stats
// @access  Private (Pharmacy)
router.get("/dashboard-stats", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ userId: req.user.id });
    if (!pharmacy) return res.status(404).json({ error: "Pharmacy not found" });

    // Inventory Stats
    const lowStockCount = await PharmacyProduct.countDocuments({ pharmacyId: pharmacy._id, stock: { $lte: 5, $gt: 0 } });
    const outOfStockCount = await PharmacyProduct.countDocuments({ pharmacyId: pharmacy._id, stock: 0 });

    // Sales Stats (Today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBills = await PharmacyBill.find({
      pharmacyId: pharmacy._id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayBillsCount = todayBills.length;
    const todayRevenue = todayBills.reduce((acc, bill) => acc + (bill.finalAmount || 0), 0);

    // Sales Stats (All Time)
    const allBills = await PharmacyBill.find({ pharmacyId: pharmacy._id });
    const totalBillsCount = allBills.length;
    const totalRevenue = allBills.reduce((acc, bill) => acc + (bill.finalAmount || 0), 0);

    res.json({
      success: true,
      stats: {
        lowStockCount,
        outOfStockCount,
        todayBillsCount,
        todayRevenue,
        totalBillsCount,
        totalRevenue
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Submit Onboarding (Pharmacy)
// @route   PUT /api/pharmacies/onboarding
// @access  Private (Pharmacy)
router.put("/onboarding", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const updateData = req.body;
    
    // Set onboarding complete
    updateData.onboardingComplete = true;

    const pharmacy = await Pharmacy.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true }
    );

    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy record not found" });
    }

    // Update User if needed (like name)
    if (updateData.name) {
      await User.findByIdAndUpdate(req.user.id, { name: updateData.name });
    }

    res.json({ success: true, message: "Onboarding completed successfully", pharmacy });
  } catch (error) {
    console.error("Pharmacy onboarding error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Update Pharmacy (Admin)
// @route   PUT /api/pharmacies/:id
// @access  Private (Admin, Superadmin)
router.put("/:id", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const { name, shopName, status } = req.body;
    
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }

    if (name) pharmacy.name = name;
    if (shopName) pharmacy.shopName = shopName;
    if (status) pharmacy.status = status;

    await pharmacy.save();
    
    if (name) {
      await User.findByIdAndUpdate(pharmacy.userId, { name });
    }

    res.json({ success: true, message: "Pharmacy updated successfully", pharmacy });
  } catch (error) {
    console.error("Update pharmacy error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Delete/Deactivate Pharmacy (Admin)
// @route   DELETE /api/pharmacies/:id
// @access  Private (Admin, Superadmin)
router.delete("/:id", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }

    // Soft delete by setting status to Terminated/Inactive
    pharmacy.status = "Terminated";
    await pharmacy.save();

    res.json({ success: true, message: "Pharmacy deactivated successfully" });
  } catch (error) {
    console.error("Delete pharmacy error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
