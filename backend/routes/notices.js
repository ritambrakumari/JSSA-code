import express from "express";
import { body, validationResult } from "express-validator";
import Notice from "../models/Notice.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/notices
 * Get all notices (public endpoint for landing page)
 */
router.get("/", async (req, res) => {
  try {
    const { active } = req.query;
    
    let query = {};
    if (active === "true") {
      query.isActive = true;
    }

    const notices = await Notice.find(query)
      .populate("createdBy", "email name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { notices },
    });
  } catch (error) {
    console.error("Get notices error:", error);
    res.status(500).json({
      error: "Failed to fetch notices",
      message: error.message,
    });
  }
});

/**
 * GET /api/notices/:id
 * Get single notice (public endpoint)
 */
router.get("/:id", async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).populate(
      "createdBy",
      "email name"
    );

    if (!notice) {
      return res.status(404).json({
        error: "Notice not found",
      });
    }

    res.json({
      success: true,
      data: { notice },
    });
  } catch (error) {
    console.error("Get notice error:", error);
    res.status(500).json({
      error: "Failed to fetch notice",
      message: error.message,
    });
  }
});

// All other routes require authentication
router.use(authenticate);

/**
 * POST /api/notices
 * Create new notice (admin only)
 */
router.post(
  "/",
  [
    body("noticeEnglish")
      .optional()
      .trim(),
    body("noticeHindi")
      .optional()
      .trim(),
    body("importantNotice")
      .optional()
      .trim(),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  async (req, res) => {
    try {
      // Only admin can create notices
      if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can create notices",
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
        noticeEnglish,
        noticeHindi,
        importantNotice,
        isActive,
      } = req.body;

      const notice = new Notice({
        noticeEnglish: noticeEnglish || "",
        noticeHindi: noticeHindi || "",
        importantNotice: importantNotice || "",
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user.id,
      });

      await notice.save();
      await notice.populate("createdBy", "email name");

      res.status(201).json({
        success: true,
        message: "Notice created successfully",
        data: { notice },
      });
    } catch (error) {
      console.error("Create notice error:", error);
      res.status(500).json({
        error: "Failed to create notice",
        message: error.message,
      });
    }
  }
);

/**
 * PUT /api/notices/:id
 * Update notice (admin only)
 */
router.put(
  "/:id",
  [
    body("noticeEnglish")
      .optional()
      .trim(),
    body("noticeHindi")
      .optional()
      .trim(),
    body("importantNotice")
      .optional()
      .trim(),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  async (req, res) => {
    try {
      // Only admin can update notices
      if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can update notices",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const notice = await Notice.findById(req.params.id);
      if (!notice) {
        return res.status(404).json({
          error: "Notice not found",
        });
      }

      const {
        noticeEnglish,
        noticeHindi,
        importantNotice,
        isActive,
      } = req.body;

      if (noticeEnglish !== undefined) notice.noticeEnglish = noticeEnglish;
      if (noticeHindi !== undefined) notice.noticeHindi = noticeHindi;
      if (importantNotice !== undefined) notice.importantNotice = importantNotice;
      if (isActive !== undefined) notice.isActive = isActive;

      await notice.save();
      await notice.populate("createdBy", "email name");

      res.json({
        success: true,
        message: "Notice updated successfully",
        data: { notice },
      });
    } catch (error) {
      console.error("Update notice error:", error);
      res.status(500).json({
        error: "Failed to update notice",
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/notices/:id
 * Delete notice (admin only)
 */
router.delete("/:id", async (req, res) => {
  try {
    // Only admin can delete notices
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can delete notices",
      });
    }

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        error: "Notice not found",
      });
    }

    await Notice.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (error) {
    console.error("Delete notice error:", error);
    res.status(500).json({
      error: "Failed to delete notice",
      message: error.message,
    });
  }
});

export default router;
