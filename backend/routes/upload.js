import express from "express";
import { upload, uploadPDF } from "../middleware/upload.js";
import { authenticate } from "../middleware/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/advertisements");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory:", uploadsDir);
}

const applicationPhotosDir = path.join(__dirname, "../uploads/applications/photos");
if (!fs.existsSync(applicationPhotosDir)) {
  fs.mkdirSync(applicationPhotosDir, { recursive: true });
  console.log("✅ Created application photos directory:", applicationPhotosDir);
}

const applicationSignaturesDir = path.join(__dirname, "../uploads/applications/signatures");
if (!fs.existsSync(applicationSignaturesDir)) {
  fs.mkdirSync(applicationSignaturesDir, { recursive: true });
  console.log("✅ Created application signatures directory:", applicationSignaturesDir);
}

const mouDocsDir = path.join(__dirname, "../uploads/mou/documents");
if (!fs.existsSync(mouDocsDir)) {
  fs.mkdirSync(mouDocsDir, { recursive: true });
  console.log("✅ Created MOU documents directory:", mouDocsDir);
}

const feedsDir = path.join(__dirname, "../uploads/feeds");
if (!fs.existsSync(feedsDir)) {
  fs.mkdirSync(feedsDir, { recursive: true });
  console.log("✅ Created feeds directory:", feedsDir);
}

const blogsDir = path.join(__dirname, "../uploads/blogs");
if (!fs.existsSync(blogsDir)) {
  fs.mkdirSync(blogsDir, { recursive: true });
  console.log("✅ Created blogs directory:", blogsDir);
}

const doctorsDir = path.join(__dirname, "../uploads/doctors");
if (!fs.existsSync(doctorsDir)) {
  fs.mkdirSync(doctorsDir, { recursive: true });
  console.log("✅ Created doctors directory:", doctorsDir);
}

const createPublicFileUrl = (req, relativePath) => {
  const protocol = req.protocol || "http";
  const host = req.get("host") || process.env.BACKEND_URL || `localhost:${process.env.PORT || 3006}`;
  return `${protocol}://${host}/api/files/${relativePath.replace(/\\/g, "/")}`;
};

/**
 * POST /api/upload/application-file
 * Public endpoint for application photo/signature uploads - saves locally
 */
router.post("/application-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file provided",
        message: "Please select a file to upload",
      });
    }

    const fileType = req.body?.type;
    if (fileType !== "photo" && fileType !== "signature") {
      return res.status(400).json({
        error: "Invalid file type",
        message: "File type must be either 'photo' or 'signature'",
      });
    }

    const targetDir = fileType === "photo" ? applicationPhotosDir : applicationSignaturesDir;
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const originalName = req.file.originalname || "image";
    const ext = path.extname(originalName) || ".jpg";
    const filename = `${fileType}_${timestamp}_${randomStr}${ext}`;
    const filepath = path.join(targetDir, filename);

    fs.writeFileSync(filepath, req.file.buffer);

    const relativePath = fileType === "photo"
      ? `applications/photos/${filename}`
      : `applications/signatures/${filename}`;

    res.json({
      success: true,
      message: `${fileType} uploaded successfully`,
      data: {
        type: fileType,
        filename,
        url: createPublicFileUrl(req, relativePath),
      },
    });
  } catch (error) {
    console.error("Upload application file error:", error);
    res.status(500).json({
      error: "Failed to upload file",
      message: error.message,
    });
  }
});

/**
 * POST /api/upload/mou-document
 * Authenticated endpoint for MOU required documents (Aadhaar, PAN, Bank)
 */
router.post("/mou-document", authenticate, uploadPDF.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const fileType = req.body?.type || "doc";
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const originalName = req.file.originalname || "document";
    const ext = path.extname(originalName) || ".jpg";
    const filename = `mou_${fileType}_${timestamp}_${randomStr}${ext}`;
    const filepath = path.join(mouDocsDir, filename);

    fs.writeFileSync(filepath, req.file.buffer);

    const relativePath = `mou/documents/${filename}`;

    res.json({
      success: true,
      message: `${fileType} uploaded successfully`,
      data: {
        type: fileType,
        filename,
        url: createPublicFileUrl(req, relativePath),
      },
    });
  } catch (error) {
    console.error("Upload MOU document error:", error);
    res.status(500).json({ error: "Failed to upload file", message: error.message });
  }
});

// Routes below require authentication
router.use(authenticate);

/**
 * POST /api/upload/advertisement
 * Upload advertisement PDF or image (admin only) - saves locally
 */
router.post("/advertisement", uploadPDF.single("file"), async (req, res) => {
  try {
    // Only admin can upload files
    if (!(["admin", "superadmin"].includes(req.user.role))) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can upload advertisement files",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "No file provided",
        message: "Please select a file to upload",
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const originalName = req.file.originalname || "file";
    const ext = path.extname(originalName) || (req.file.mimetype === "application/pdf" ? ".pdf" : ".jpg");
    const filename = `${timestamp}_${randomStr}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file to local storage
    fs.writeFileSync(filepath, req.file.buffer);

    // Get base URL from request or environment
    const protocol = req.protocol || "http";
    const host = req.get("host") || process.env.BACKEND_URL || `localhost:${process.env.PORT || 3006}`;
    const baseUrl = `${protocol}://${host}`;

    // Return full local file URL
    const fileUrl = `${baseUrl}/api/files/advertisements/${filename}`;

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: fileUrl,
        filename: filename,
      },
    });
  } catch (error) {
    console.error("Upload advertisement file error:", error);
    res.status(500).json({
      error: "Failed to upload file",
      message: error.message,
    });
  }
});

/**
 * POST /api/upload/feed-image
 * Authenticated endpoint for Employee Feed image uploads
 */
router.post("/feed-image", authenticate, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const originalName = req.file.originalname || "feed_post";
    const ext = path.extname(originalName) || ".jpg";
    const filename = `feed_${timestamp}_${randomStr}${ext}`;
    const filepath = path.join(feedsDir, filename);

    fs.writeFileSync(filepath, req.file.buffer);

    const relativePath = `feeds/${filename}`;

    res.json({
      success: true,
      message: "Feed image uploaded successfully",
      data: {
        filename,
        url: createPublicFileUrl(req, relativePath),
      },
    });
  } catch (error) {
    console.error("Upload feed image error:", error);
    res.status(500).json({ error: "Failed to upload file", message: error.message });
  }
});

/**
 * POST /api/upload/blog-image
 * Authenticated endpoint for Blog image uploads
 */
router.post("/blog-image", authenticate, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const originalName = req.file.originalname || "blog_image";
    const ext = path.extname(originalName) || ".jpg";
    const filename = `blog_${timestamp}_${randomStr}${ext}`;
    const filepath = path.join(blogsDir, filename);

    fs.writeFileSync(filepath, req.file.buffer);

    const relativePath = `blogs/${filename}`;

    res.json({
      success: true,
      message: "Blog image uploaded successfully",
      data: {
        filename,
        fileUrl: createPublicFileUrl(req, relativePath),
      },
    });
  } catch (error) {
    console.error("Upload blog image error:", error);
    res.status(500).json({ error: "Failed to upload file", message: error.message });
  }
});

/**
 * POST /api/upload/doctor-image
 * Authenticated endpoint for Doctor image uploads
 */
router.post("/doctor-image", authenticate, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const originalName = req.file.originalname || "doctor_image";
    const ext = path.extname(originalName) || ".jpg";
    const filename = `doctor_${timestamp}_${randomStr}${ext}`;
    const filepath = path.join(doctorsDir, filename);

    fs.writeFileSync(filepath, req.file.buffer);

    const relativePath = `doctors/${filename}`;

    res.json({
      success: true,
      message: "Doctor image uploaded successfully",
      data: {
        filename,
        fileUrl: createPublicFileUrl(req, relativePath),
      },
    });
  } catch (error) {
    console.error("Upload doctor image error:", error);
    res.status(500).json({ error: "Failed to upload file", message: error.message });
  }
});

export default router;
