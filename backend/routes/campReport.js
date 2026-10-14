import express from 'express';
import { authenticate } from '../middleware/auth.js';
import CampReport from '../models/CampReport.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const campUploadsDir = path.join(__dirname, "../uploads/camp_reports");
if (!fs.existsSync(campUploadsDir)) {
  fs.mkdirSync(campUploadsDir, { recursive: true });
}

const router = express.Router();

// Memory storage for multer
const storage = multer.memoryStorage();

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|wmv|mkv/;
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"));
  }
};

const uploadMedia = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max overall limit
  },
  fileFilter: fileFilter,
});


/**
 * POST /api/camp-report
 * Create a new camp report
 */
router.post('/', authenticate, uploadMedia.array('media', 10), async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        if (typeof tags === 'string') parsedTags = tags.split(',');
        else parsedTags = tags;
      }
    }

    const uploadedImages = [];
    const uploadedVideos = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const isVideo = file.mimetype.startsWith('video/');

        // Size validation based on type
        if (isVideo && file.size > 50 * 1024 * 1024) {
          return res.status(400).json({ success: false, message: "Video size exceeds 50MB limit" });
        }
        if (!isVideo && file.size > 10 * 1024 * 1024) {
          return res.status(400).json({ success: false, message: "Image size exceeds 10MB limit" });
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const originalName = file.originalname || (isVideo ? 'video.mp4' : 'image.jpg');
        const ext = path.extname(originalName) || (isVideo ? '.mp4' : '.jpg');
        const filename = `${timestamp}_${randomStr}${ext}`;
        const filepath = path.join(campUploadsDir, filename);

        // Save file locally
        fs.writeFileSync(filepath, file.buffer);

        // Get base URL
        const protocol = req.protocol || "http";
        const host = req.get("host") || process.env.BACKEND_URL || `localhost:${process.env.PORT || 3006}`;
        const baseUrl = `${protocol}://${host}`;
        const fileUrl = `${baseUrl}/api/files/camp_reports/${filename}`;

        if (isVideo) {
          uploadedVideos.push(fileUrl);
        } else {
          uploadedImages.push(fileUrl);
        }
      }
    }

    const newReport = new CampReport({
      title,
      description,
      tags: parsedTags,
      images: uploadedImages,
      videos: uploadedVideos,
      createdBy: req.user.id
    });

    await newReport.save();

    res.status(201).json({ success: true, message: "Camp Report submitted successfully", data: newReport });
  } catch (error) {
    console.error("Camp Report Create Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/camp-report/my-reports
 * Get all camp reports for logged in RM
 */
router.get('/my-reports', authenticate, async (req, res) => {
  try {
    const reports = await CampReport.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/camp-report/all
 * Get all camp reports (Admin)
 */
router.get('/all', authenticate, async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'admin' && role !== 'superadmin' && role !== 'staff') { // RM is usually staff but admin views this
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const reports = await CampReport.find()
      .populate({
        path: 'createdBy',
        select: 'name email role photo',
        populate: {
          path: 'employeeId',
          select: 'name designation employeeId photo'
        }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/camp-report/:id
 * Update a camp report
 */
router.put('/:id', authenticate, uploadMedia.array('media', 10), async (req, res) => {
  try {
    const reportId = req.params.id;
    const { title, description, tags, existingImages, existingVideos } = req.body;

    const report = await CampReport.findOne({ _id: reportId, createdBy: req.user.id });
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found or unauthorized" });
    }

    let parsedTags = [];
    if (tags) {
      try { parsedTags = JSON.parse(tags); } catch (e) { parsedTags = []; }
    }

    let parsedExistingImages = [];
    let parsedExistingVideos = [];
    if (existingImages) {
      try { parsedExistingImages = JSON.parse(existingImages); } catch (e) { parsedExistingImages = []; }
    }
    if (existingVideos) {
      try { parsedExistingVideos = JSON.parse(existingVideos); } catch (e) { parsedExistingVideos = []; }
    }

    const newUploadedImages = [];
    const newUploadedVideos = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const isVideo = file.mimetype.startsWith('video/');

        if (isVideo && file.size > 50 * 1024 * 1024) {
          return res.status(400).json({ success: false, message: "Video size exceeds 50MB limit" });
        }
        if (!isVideo && file.size > 10 * 1024 * 1024) {
          return res.status(400).json({ success: false, message: "Image size exceeds 10MB limit" });
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const originalName = file.originalname || (isVideo ? 'video.mp4' : 'image.jpg');
        const ext = path.extname(originalName) || (isVideo ? '.mp4' : '.jpg');
        const filename = `${timestamp}_${randomStr}${ext}`;
        const filepath = path.join(campUploadsDir, filename);

        fs.writeFileSync(filepath, file.buffer);

        const protocol = req.protocol || "http";
        const host = req.get("host") || process.env.BACKEND_URL || `localhost:${process.env.PORT || 3006}`;
        const baseUrl = `${protocol}://${host}`;
        const fileUrl = `${baseUrl}/api/files/camp_reports/${filename}`;

        if (isVideo) {
          newUploadedVideos.push(fileUrl);
        } else {
          newUploadedImages.push(fileUrl);
        }
      }
    }

    report.title = title || report.title;
    report.description = description || report.description;
    report.tags = parsedTags;
    report.images = [...parsedExistingImages, ...newUploadedImages];
    report.videos = [...parsedExistingVideos, ...newUploadedVideos];

    await report.save();

    res.json({ success: true, message: "Camp Report updated successfully", data: report });
  } catch (error) {
    console.error("Camp Report Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/camp-report/:id
 * Delete a camp report (Admin/RM)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const reportId = req.params.id;
    const { role } = req.user;
    
    const query = { _id: reportId };
    if (role === 'employee') {
      query.createdBy = req.user.id;
    } else if (role !== 'admin' && role !== 'superadmin' && role !== 'staff') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const report = await CampReport.findOneAndDelete(query);
    
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found or unauthorized" });
    }

    res.json({ success: true, message: "Camp Report deleted successfully" });
  } catch (error) {
    console.error("Camp Report Delete Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
