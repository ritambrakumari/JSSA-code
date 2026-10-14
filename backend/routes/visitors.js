import express from "express";
import Visitor from "../models/Visitor.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);
// Restrict to admin and superadmin roles
router.use(authorize(["admin", "superadmin", "staff"]));

// @desc    Get all visitors
// @route   GET /api/visitors
// @access  Private (Admin)
router.get("/", async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ checkInTime: -1 });
    res.json({ success: true, data: visitors });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    res.status(500).json({ success: false, error: "Failed to fetch visitors" });
  }
});

// @desc    Create a new visitor (Check-In)
// @route   POST /api/visitors
// @access  Private (Admin)
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, reason } = req.body;

    if (!name || !phone || !reason) {
      return res.status(400).json({
        success: false,
        error: "Name, phone, and reason are required fields.",
      });
    }

    const newVisitor = new Visitor({
      name,
      email,
      phone,
      reason,
      status: "Checked-In",
    });

    await newVisitor.save();

    res.status(201).json({ success: true, data: newVisitor });
  } catch (error) {
    console.error("Error creating visitor:", error);
    res.status(500).json({ success: false, error: "Failed to add visitor" });
  }
});

// @desc    Check-Out a visitor
// @route   PUT /api/visitors/:id/checkout
// @access  Private (Admin)
router.put("/:id/checkout", async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ success: false, error: "Visitor not found" });
    }

    if (visitor.status === "Checked-Out") {
      return res.status(400).json({ success: false, error: "Visitor is already checked out." });
    }

    visitor.status = "Checked-Out";
    visitor.checkOutTime = new Date();
    await visitor.save();

    res.json({ success: true, data: visitor });
  } catch (error) {
    console.error("Error checking out visitor:", error);
    res.status(500).json({ success: false, error: "Failed to checkout visitor" });
  }
});

// Delete a visitor record
router.delete("/:id", async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndDelete(req.params.id);
    if (!visitor) {
      return res.status(404).json({ success: false, error: "Visitor not found" });
    }
    res.json({ success: true, data: visitor });
  } catch (error) {
    console.error("Error deleting visitor:", error);
    res.status(500).json({ success: false, error: "Failed to delete visitor" });
  }
});

export default router;
