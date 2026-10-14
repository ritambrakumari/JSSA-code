import express from "express";
import Enquiry from "../models/Enquiry.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/enquiries
// @desc    Submit a new enquiry (Public)
// @access  Public
router.post("/", async (req, res) => {
  try {
    const { name, contact, email, address, state, city, zip, message } = req.body;

    if (!name || !contact || !email) {
      return res.status(400).json({ success: false, message: "Name, contact and email are required" });
    }

    const enquiry = await Enquiry.create({
      name,
      contact,
      email,
      address,
      state,
      city,
      zip,
      message,
    });

    res.status(201).json({ success: true, data: enquiry });
  } catch (error) {
    console.error("Submit Enquiry Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @route   GET /api/enquiries
// @desc    Get all enquiries with pagination & search (Admin)
// @access  Private/Admin
router.get("/", authenticate, authorize("admin", "superadmin", "staff"), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { contact: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const total = await Enquiry.countDocuments(query);
    const enquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        enquiries,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get Enquiries Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @route   PATCH /api/enquiries/:id
// @desc    Update enquiry status and remarks (Admin)
// @access  Private/Admin
router.patch("/:id", authenticate, authorize("admin", "superadmin", "staff"), async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: "Enquiry not found" });
    }

    if (status) enquiry.status = status;
    if (adminRemarks !== undefined) enquiry.adminRemarks = adminRemarks;

    await enquiry.save();

    res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    console.error("Update Enquiry Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;
