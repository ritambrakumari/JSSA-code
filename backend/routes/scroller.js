import express from "express";
import { body, validationResult } from "express-validator";
import Scroller from "../models/Scroller.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const scrollerUploadsDir = path.join(__dirname, "../uploads/scroller");
if (!fs.existsSync(scrollerUploadsDir)) {
  fs.mkdirSync(scrollerUploadsDir, { recursive: true });
  console.log("✅ Created scroller uploads directory:", scrollerUploadsDir);
}

/**
 * GET /api/scroller
 * Get all scroller images (public endpoint for landing page)
 */
router.get("/", async (req, res) => {
  try {
    const { active } = req.query;

    let query = {};
    if (active === "true") {
      query.isActive = true;
    }

    const scrollerImages = await Scroller.find(query)
      .populate("uploadedBy", "email name")
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      data: { scrollerImages },
    });
  } catch (error) {
    console.error("Get scroller error:", error);
    res.status(500).json({
      error: "Failed to fetch scroller images",
      message: error.message,
    });
  }
});

/**
 * GET /api/scroller/:id
 * Get single scroller image
 */
router.get("/:id", async (req, res) => {
  try {
    const image = await Scroller.findById(req.params.id).populate(
      "uploadedBy",
      "email name"
    );

    if (!image) {
      return res.status(404).json({
        error: "Image not found",
      });
    }

    res.json({
      success: true,
      data: { image },
    });
  } catch (error) {
    console.error("Get scroller image error:", error);
    res.status(500).json({
      error: "Failed to fetch scroller image",
      message: error.message,
    });
  }
});

// All other routes require authentication
router.use(authenticate);

/**
 * POST /api/scroller
 * Upload new scroller image (admin only)
 */
router.post(
  "/",
  upload.single("image"),
  [
    body("title").optional().isString(),
    body("description").optional().isString(),
    body("order").optional().isInt(),
    body("link").optional().isString(),
  ],
  async (req, res) => {
    try {
      // Only admin can upload images
      if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can upload scroller images",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "Image is required",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const originalName = req.file.originalname || "image";
      const ext = path.extname(originalName) || ".jpg";
      const filename = `${timestamp}_${randomStr}${ext}`;
      const filepath = path.join(scrollerUploadsDir, filename);

      // Save file to local storage
      fs.writeFileSync(filepath, req.file.buffer);

      // Get base URL from request or environment
      const protocol = req.protocol || "http";
      const host = req.get("host") || process.env.BACKEND_URL || `localhost:${process.env.PORT || 3006}`;
      const baseUrl = `${protocol}://${host}`;

      // Return full local file URL
      const fileUrl = `${baseUrl}/api/files/scroller/${filename}`;

      const scroller = new Scroller({
        title: req.body.title || "",
        description: req.body.description || "",
        imageUrl: fileUrl,
        cloudinaryPublicId: "", // Keep for backward compatibility but empty
        imageName: req.file.originalname,
        uploadedBy: req.user.id,
        order: parseInt(req.body.order) || 0,
        isActive: req.body.isActive !== "false",
        link: req.body.link || "",
      });

      await scroller.save();
      await scroller.populate("uploadedBy", "email name");

      res.status(201).json({
        success: true,
        message: "Scroller image uploaded successfully",
        data: { image: scroller },
      });
    } catch (error) {
      console.error("Upload scroller image error:", error);
      res.status(500).json({
        error: "Failed to upload image",
        message: error.message,
      });
    }
  }
);

/**
 * PUT /api/scroller/:id
 * Update scroller image (admin only)
 */
router.put(
  "/:id",
  [
    body("title").optional().isString(),
    body("description").optional().isString(),
    body("order").optional().isInt(),
    body("isActive").optional().isBoolean(),
    body("link").optional().isString(),
  ],
  async (req, res) => {
    try {
      // Only admin can update images
      if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can update scroller images",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const image = await Scroller.findById(req.params.id);
      if (!image) {
        return res.status(404).json({
          error: "Image not found",
        });
      }

      if (req.body.title !== undefined) image.title = req.body.title;
      if (req.body.description !== undefined)
        image.description = req.body.description;
      if (req.body.order !== undefined) image.order = parseInt(req.body.order);
      if (req.body.isActive !== undefined)
        image.isActive = req.body.isActive === "true" || req.body.isActive === true;
      if (req.body.link !== undefined) image.link = req.body.link;

      await image.save();
      await image.populate("uploadedBy", "email name");

      res.json({
        success: true,
        message: "Scroller image updated successfully",
        data: { image },
      });
    } catch (error) {
      console.error("Update scroller image error:", error);
      res.status(500).json({
        error: "Failed to update image",
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/scroller/:id
 * Delete scroller image (admin only)
 */
router.delete("/:id", async (req, res) => {
  try {
    // Only admin can delete images
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can delete scroller images",
      });
    }

    const image = await Scroller.findById(req.params.id);
    if (!image) {
      return res.status(404).json({
        error: "Image not found",
      });
    }

    // Delete file from local storage
    try {
      // Extract filename from imageUrl
      if (image.imageUrl && image.imageUrl.includes('/api/files/scroller/')) {
        const filename = image.imageUrl.split('/api/files/scroller/')[1];
        if (filename) {
          const filepath = path.join(scrollerUploadsDir, filename);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log("✅ Deleted scroller image file:", filename);
          }
        }
      }
    } catch (fileError) {
      console.error("Error deleting scroller image file:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    await Scroller.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Scroller image deleted successfully",
    });
  } catch (error) {
    console.error("Delete scroller image error:", error);
    res.status(500).json({
      error: "Failed to delete image",
      message: error.message,
    });
  }
});

export default router;
