import express from "express";
const router = express.Router();
import Announcement from "../models/Announcement.js";
import { authenticate, authorize } from "../middleware/auth.js";

/**
 * @route   GET /api/announcements
 * @desc    Get all announcements (Admin view includes drafts)
 */
router.get("/", authenticate, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show published employee announcements that haven't expired
    if (req.user.role !== "admin") {
      query = { 
        status: "Published", 
        targetRole: "employee",
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: { $gt: new Date() } }
        ]
      };
    } else {
      // Auto-expire logic for admin view
      await Announcement.updateMany(
        { status: "Published", expiryDate: { $lt: new Date() } },
        { status: "Expired" }
      );
    }

    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    res.json({
      success: true,
      data: announcements,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/announcements/latest
 * @desc    Get the latest published announcement for employees
 */
router.get("/latest", authenticate, async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ 
      status: "Published", 
      targetRole: "employee",
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gt: new Date() } }
      ]
    }).sort({ publishedAt: -1 });

    res.json({
      success: true,
      data: announcement,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/announcements
 * @desc    Create a new announcement (Admin only)
 */
router.post("/", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const { title, message, status, expiryDate } = req.body;
    
    let finalExpiry = expiryDate;
    if (expiryDate) {
      const d = new Date(expiryDate);
      d.setHours(23, 59, 59, 999);
      finalExpiry = d;
    }

    const announcement = new Announcement({
      title,
      message,
      status: status || "Draft",
      expiryDate: finalExpiry,
      createdBy: req.user.id
    });

    await announcement.save();

    res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * @route   PATCH /api/announcements/:id
 * @desc    Update an announcement (Admin only)
 */
router.patch("/:id", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const { title, message, status, expiryDate } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, error: "Announcement not found" });
    }

    if (title) announcement.title = title;
    if (message) announcement.message = message;
    if (status) announcement.status = status;
    if (expiryDate !== undefined) {
      if (expiryDate) {
        const d = new Date(expiryDate);
        d.setHours(23, 59, 59, 999);
        announcement.expiryDate = d;
      } else {
        announcement.expiryDate = null;
      }
    }

    await announcement.save();

    res.json({
      success: true,
      data: announcement,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * @route   DELETE /api/announcements/:id
 * @desc    Delete an announcement (Admin only)
 */
router.delete("/:id", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, error: "Announcement not found" });
    }

    res.json({
      success: true,
      message: "Announcement deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
