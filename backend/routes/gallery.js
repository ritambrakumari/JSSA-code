import express from "express";
import { body, validationResult } from "express-validator";
import Gallery from "../models/Gallery.js";
import { authenticate } from "../middleware/auth.js";
import { upload, uploadToCloudinary, deleteCloudinaryImage } from "../middleware/upload.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const galleryUploadsDir = path.join(__dirname, "../uploads/gallery");
if (!fs.existsSync(galleryUploadsDir)) {
  fs.mkdirSync(galleryUploadsDir, { recursive: true });
  console.log("✅ Created gallery uploads directory:", galleryUploadsDir);
}

/**
 * GET /api/gallery
 * Get all gallery images (public endpoint for landing page)
 */
router.get("/", async (req, res) => {
  try {
    const { active } = req.query;

    let query = {};
    if (active === "true") {
      query.isActive = true;
    }

    const images = await Gallery.find(query)
      .populate("uploadedBy", "email name")
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      data: { images },
    });
  } catch (error) {
    console.error("Get gallery error:", error);
    res.status(500).json({
      error: "Failed to fetch gallery images",
      message: error.message,
    });
  }
});

/**
 * GET /api/gallery/:id
 * Get single gallery image (public endpoint)
 */
router.get("/:id", async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id).populate(
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
    console.error("Get gallery image error:", error);
    res.status(500).json({
      error: "Failed to fetch gallery image",
      message: error.message,
    });
  }
});

// All other routes require authentication
router.use(authenticate);

/**
 * POST /api/gallery
 * Upload new gallery image (admin only)
 */
router.post(
  "/",
  upload.single("image"),
  [
    body("title").optional().isString(),
    body("description").optional().isString(),
    body("order").optional().isInt(),
  ],
  async (req, res) => {
    try {
      // Only admin can upload images
      if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can upload gallery images",
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

      // Upload to Cloudinary (persistent storage — survives backend restarts/redeploys)
      const { url: fileUrl, public_id: cloudinaryPublicId } = await uploadToCloudinary(
        req.file.buffer,
        "jssa/gallery"
      );

      const gallery = new Gallery({
        title: req.body.title || "",
        description: req.body.description || "",
        imageUrl: fileUrl,
        cloudinaryPublicId,
        imageName: req.file.originalname,
        uploadedBy: req.user.id,
        order: parseInt(req.body.order) || 0,
        isActive: req.body.isActive !== "false",
      });

      await gallery.save();
      await gallery.populate("uploadedBy", "email name");

      res.status(201).json({
        success: true,
        message: "Image uploaded successfully",
        data: { image: gallery },
      });
    } catch (error) {
      console.error("Upload gallery image error:", error);
      res.status(500).json({
        error: "Failed to upload image",
        message: error.message,
      });
    }
  }
);

/**
 * PUT /api/gallery/:id
 * Update gallery image (admin only)
 */
router.put(
  "/:id",
  [
    body("title").optional().isString(),
    body("description").optional().isString(),
    body("order").optional().isInt(),
    body("isActive").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      // Only admin can update images
      if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can update gallery images",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const image = await Gallery.findById(req.params.id);
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

      await image.save();
      await image.populate("uploadedBy", "email name");

      res.json({
        success: true,
        message: "Image updated successfully",
        data: { image },
      });
    } catch (error) {
      console.error("Update gallery image error:", error);
      res.status(500).json({
        error: "Failed to update image",
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/gallery/:id
 * Delete gallery image (admin only)
 */
router.delete("/:id", async (req, res) => {
  try {
    // Only admin can delete images
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can delete gallery images",
      });
    }

    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({
        error: "Image not found",
      });
    }

    // Delete image from Cloudinary (if it has a Cloudinary public ID)
    try {
      if (image.cloudinaryPublicId) {
        await deleteCloudinaryImage(image.cloudinaryPublicId);
        console.log("✅ Deleted gallery image from Cloudinary:", image.cloudinaryPublicId);
      } else if (image.imageUrl && image.imageUrl.includes('/api/files/gallery/')) {
        // Legacy local-storage image — try to delete from local disk too
        const filename = image.imageUrl.split('/api/files/gallery/')[1];
        if (filename) {
          const filepath = path.join(galleryUploadsDir, filename);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log("✅ Deleted gallery image file:", filename);
          }
        }
      }
    } catch (fileError) {
      console.error("Error deleting gallery image file:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    await Gallery.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete gallery image error:", error);
    res.status(500).json({
      error: "Failed to delete image",
      message: error.message,
    });
  }
});

export default router;
