import express from "express";
import { body, validationResult } from "express-validator";
import Notification from "../models/Notification.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/notifications
 * Get all notifications (public endpoint for landing page)
 */
router.get("/", async (req, res) => {
  try {
    const { active } = req.query;
    
    let query = {};
    if (active === "true") {
      query.isActive = true;
    }

    const notifications = await Notification.find(query)
      .populate("createdBy", "email name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { notifications },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      error: "Failed to fetch notifications",
      message: error.message,
    });
  }
});

/**
 * GET /api/notifications/:id
 * Get single notification (public endpoint)
 */
router.get("/:id", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id).populate(
      "createdBy",
      "email name"
    );

    if (!notification) {
      return res.status(404).json({
        error: "Notification not found",
      });
    }

    res.json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    console.error("Get notification error:", error);
    res.status(500).json({
      error: "Failed to fetch notification",
      message: error.message,
    });
  }
});

// All other routes require authentication
router.use(authenticate);

/**
 * POST /api/notifications
 * Create new notification (admin only)
 */
router.post(
  "/",
  [
    body("title")
      .notEmpty()
      .withMessage("Title is required")
      .trim()
      .isLength({ max: 200 })
      .withMessage("Title cannot exceed 200 characters"),
    body("url")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("URL cannot exceed 500 characters"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  async (req, res) => {
    try {
      // Only admin can create notifications
      if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can create notifications",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        title,
        url,
        notificationDate,
        notificationTime,
        isActive,
      } = req.body;

      const notification = new Notification({
        title: title,
        url: url || "",
        notificationDate: notificationDate ? new Date(notificationDate) : new Date(),
        notificationTime: notificationTime || "",
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user.id,
      });

      await notification.save();
      await notification.populate("createdBy", "email name");

      res.status(201).json({
        success: true,
        message: "Notification created successfully",
        data: { notification },
      });
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({
        error: "Failed to create notification",
        message: error.message,
      });
    }
  }
);

/**
 * PUT /api/notifications/:id
 * Update notification (admin only)
 */
router.put(
  "/:id",
  [
    body("title")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Title cannot exceed 200 characters"),
    body("url")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("URL cannot exceed 500 characters"),
    body("notificationDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid notification date format"),
    body("notificationTime")
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage("Notification time cannot exceed 20 characters"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  async (req, res) => {
    try {
      // Only admin can update notifications
      if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can update notifications",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const notification = await Notification.findById(req.params.id);
      if (!notification) {
        return res.status(404).json({
          error: "Notification not found",
        });
      }

      const {
        title,
        url,
        notificationDate,
        notificationTime,
        isActive,
      } = req.body;

      if (title !== undefined) notification.title = title;
      if (url !== undefined) notification.url = url;
      if (notificationDate !== undefined) notification.notificationDate = new Date(notificationDate);
      if (notificationTime !== undefined) notification.notificationTime = notificationTime;
      if (isActive !== undefined) notification.isActive = isActive;

      await notification.save();
      await notification.populate("createdBy", "email name");

      res.json({
        success: true,
        message: "Notification updated successfully",
        data: { notification },
      });
    } catch (error) {
      console.error("Update notification error:", error);
      res.status(500).json({
        error: "Failed to update notification",
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/notifications/:id
 * Delete notification (admin only)
 */
router.delete("/:id", async (req, res) => {
  try {
    // Only admin can delete notifications
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can delete notifications",
      });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        error: "Notification not found",
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      error: "Failed to delete notification",
      message: error.message,
    });
  }
});

export default router;
