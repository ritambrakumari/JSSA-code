import express from "express";
import { body, validationResult } from "express-validator";
import JobPosting from "../models/JobPosting.js";
import Application from "../models/Application.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const parseFlexibleDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim();

  const nativeParsed = new Date(raw);
  if (!Number.isNaN(nativeParsed.getTime())) return nativeParsed;

  // Support DD-MM-YYYY / DD/MM/YYYY / DD.MM.YYYY
  const dayFirst = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dayFirst) {
    const day = Number(dayFirst[1]);
    const month = Number(dayFirst[2]);
    const year = Number(dayFirst[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }

  // Support YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  const yearFirst = raw.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (yearFirst) {
    const year = Number(yearFirst[1]);
    const month = Number(yearFirst[2]);
    const day = Number(yearFirst[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }

  return null;
};

const isVacancyOpenByLastDate = (lastDate) => {
  if (!lastDate) return true;
  const parsed = parseFlexibleDate(lastDate);
  if (!parsed) return true;
  parsed.setHours(23, 59, 59, 999); // inclusive of full last day
  return parsed >= new Date();
};

/**
 * GET /api/job-postings
 * Get all job postings (public, but filtered by status)
 */
router.get("/", async (req, res) => {
  try {
    const { status, search, page = 1, limit } = req.query;
    const query = {};

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Search filter
    if (search) {
      query.$or = [
        { post: { $regex: search, $options: "i" } },
        { advtNo: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const limitVal = limit !== undefined ? parseInt(limit) : 0; 
    const pageVal = parseInt(page);
    const skip = (pageVal - 1) * limitVal;

    let mongoQuery = JobPosting.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "email phone role");

    if (limitVal > 0) {
      mongoQuery = mongoQuery.skip(skip).limit(limitVal);
    }

    const postings = await mongoQuery;

    // Optional: Include application counts for each posting (for admin view)
    let postingsWithCounts = postings;
    if (req.query.includeCounts === "true") {
      postingsWithCounts = await Promise.all(
        postings.map(async (post) => {
          const count = await Application.countDocuments({ jobPostingId: post._id });
          return {
            ...post.toObject(),
            applicationCount: count,
          };
        }),
      );
    }

    const total = await JobPosting.countDocuments(query);

    res.json({
      success: true,
      data: {
        postings: postingsWithCounts,
        pagination: {
          page: parseInt(page),
          limit: limitVal,
          total,
          pages: limitVal > 0 ? Math.ceil(total / limitVal) : 1,
        },
      },
    });
  } catch (error) {
    console.error("Get job postings error:", error);
    res.status(500).json({
      error: "Failed to fetch job postings",
      message: error.message,
    });
  }
});

/**
 * GET /api/job-postings/latest-vacancies
 * Get latest vacancies (active job postings) - Public endpoint
 */
router.get("/latest-vacancies", async (req, res) => {
  try {
    // Get all active job postings, then keep only still-open vacancies by lastDate.
    const postings = await JobPosting.find({
      status: "Active",
    })
      .sort({ createdAt: -1 });

    const openPostings = postings.filter((posting) =>
      isVacancyOpenByLastDate(posting.lastDate),
    );

    // Format vacancies - show only title (combined English + Hindi string)
    const vacancies = openPostings.slice(0, 20).map((posting) => {
      // title is a single combined string (English + Hindi together)
      const title = posting.title || "";

      return {
        id: posting._id,
        english: title, // Show title for both English and Hindi
        hindi: title,   // Same title (combined) for both
        advtNo: posting.advtNo || "",
        lastDate: posting.lastDate || "",
        status: posting.status || "Active",
        link: `/job-postings/view/${posting._id}`,
      };
    });

    res.json({
      success: true,
      data: {
        vacancies,
      },
    });
  } catch (error) {
    console.error("Get latest vacancies error:", error);
    res.status(500).json({
      error: "Failed to fetch latest vacancies",
      message: error.message,
    });
  }
});

/**
 * GET /api/job-postings/latest-results
 * Get latest results (job postings with applications) - Public endpoint
 */
router.get("/latest-results", async (req, res) => {
  try {
    // Get all job postings that have applications
    const jobPostingsWithApplications = await Application.distinct("jobPostingId", {
      jobPostingId: { $ne: null },
    });

    if (jobPostingsWithApplications.length === 0) {
      return res.json({
        success: true,
        data: {
          results: [],
        },
      });
    }

    // Get job postings details
    const postings = await JobPosting.find({
      _id: { $in: jobPostingsWithApplications },
      status: "Active",
    })
      .sort({ firstMeritListDate: -1, createdAt: -1 })
      .limit(20); // Limit to latest 20 results

    // Format results with separate English and Hindi fields for parallel display
    const results = postings.map((posting) => {
      // postTitle removed; title is a single combined string
      const combinedTitle = posting.title || "";
      const hindiTitle = posting.post?.hi || "";
      const englishTitle = posting.post?.en || "";
      const advtNo = posting.advtNo || "";

      return {
        id: posting._id,
        english: combinedTitle || `First Merit List ${englishTitle} Advt.No: ${advtNo}`,
        hindi: combinedTitle || `प्रथम मेधा सूची ${hindiTitle}`,
        advtNo: advtNo,
        link: `/job-postings/view/${posting._id}`,
      };
    });

    res.json({
      success: true,
      data: {
        results,
      },
    });
  } catch (error) {
    console.error("Get latest results error:", error);
    res.status(500).json({
      error: "Failed to fetch latest results",
      message: error.message,
    });
  }
});

/**
 * GET /api/job-postings/:id
 * Get job posting by ID (public)
 */
router.get("/:id", async (req, res) => {
  try {
    const posting = await JobPosting.findById(req.params.id).populate(
      "createdBy",
      "email phone role"
    );

    if (!posting) {
      return res.status(404).json({
        error: "Job posting not found",
      });
    }

    res.json({
      success: true,
      data: { posting },
    });
  } catch (error) {
    console.error("Get job posting error:", error);
    res.status(500).json({
      error: "Failed to fetch job posting",
      message: error.message,
    });
  }
});

// All routes below require authentication
router.use(authenticate);

/**
 * POST /api/job-postings
 * Create new job posting (admin only)
 */
router.post(
  "/",
  [
    body("advtNo").notEmpty().withMessage("Advertisement number is required"),
    // Title can be string (new) or {en, hi} object (backward compatibility)
    body("title").custom((value) => {
      if (typeof value === 'string') {
        if (!value.trim()) {
          throw new Error("Title is required");
        }
        return true;
      } else if (typeof value === 'object' && value !== null) {
        if (!value.en || !value.en.trim()) {
          throw new Error("Title (English) is required");
        }
        return true;
      }
      throw new Error("Title is required");
    }),
    body("post.en").notEmpty().withMessage("Post name (English) is required"),
    body("post.hi").notEmpty().withMessage("Post name (Hindi) is required"),
    body("income.en").notEmpty().withMessage("Income range (English) is required"),
    body("income.hi").notEmpty().withMessage("Income range (Hindi) is required"),
    body("incomeMin").isNumeric().withMessage("Minimum income must be a number"),
    body("incomeMax").isNumeric().withMessage("Maximum income must be a number"),
    body("education.en").notEmpty().withMessage("Education (English) is required"),
    body("education.hi").notEmpty().withMessage("Education (Hindi) is required"),
    body("location.en").notEmpty().withMessage("Location (English) is required"),
    body("location.hi").notEmpty().withMessage("Location (Hindi) is required"),
    body("fee.en").optional().notEmpty().withMessage("Application fee (English) is required"),
    body("fee.hi").optional().notEmpty().withMessage("Application fee (Hindi) is required"),
    body("ageLimit.en").notEmpty().withMessage("Age limit (English) is required"),
    body("ageLimit.hi").notEmpty().withMessage("Age limit (Hindi) is required"),
    body("selectionProcess.en").optional(),
    body("selectionProcess.hi").optional(),
    body("lastDate").notEmpty().withMessage("Last date is required"),
    body("applicationOpeningDate").notEmpty().withMessage("Application opening date is required"),
    body("feeStructure").optional().isObject().withMessage("Fee structure must be an object"),
    body("locationArrHi").optional().isArray().withMessage("Location array (Hindi) must be an array"),
    body("advertisementFile").optional().isString(),
    body("advertisementFileHi").optional().isString(),
  ],
  async (req, res) => {
    try {
      // Only admin can create job postings
      if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can create job postings",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", JSON.stringify(errors.array(), null, 2));
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        return res.status(400).json({
          error: "Validation failed",
          message: "Please check all required fields",
          errors: errors.array(),
        });
      }

      // Normalize payload for backward compatibility:
      // - title may come as string (new) or {en,hi} (old)
      const normalizedTitle =
        typeof req.body.title === "string"
          ? req.body.title
          : req.body.title?.en || req.body.title?.hi || "";

      // Ensure all Hindi fields are included
      const postingData = {
        ...req.body,
        title: normalizedTitle,
        // postTitle has been removed from the schema; ignore if client sends it
        // Ensure locationArrHi is saved
        locationArrHi: req.body.locationArrHi || [],
        // Ensure feeStructure is saved
        feeStructure: req.body.feeStructure || {},
        // Ensure advertisement files are saved
        advertisementFile: req.body.advertisementFile || "",
        advertisementFileHi: req.body.advertisementFileHi || "",
        createdBy: req.user.id,
      };

      const posting = await JobPosting.create(postingData);

      res.status(201).json({
        success: true,
        message: "Job posting created successfully",
        data: { posting },
      });
    } catch (error) {
      console.error("Create job posting error:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          error: "Duplicate entry",
          message: "Advertisement number already exists",
        });
      }
      res.status(500).json({
        error: "Failed to create job posting",
        message: error.message,
      });
    }
  }
);

/**
 * PUT /api/job-postings/:id
 * Update job posting (admin only)
 */
router.put(
  "/:id",
  [
    body("advtNo").optional().notEmpty(),
    // postTitle removed; ignore if present
    body("post").optional().notEmpty(),
  ],
  async (req, res) => {
    try {
      // Only admin can update job postings
      if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can update job postings",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const posting = await JobPosting.findById(req.params.id);

      if (!posting) {
        return res.status(404).json({
          error: "Job posting not found",
        });
      }

      const normalizedTitle =
        req.body.title === undefined
          ? undefined
          : typeof req.body.title === "string"
            ? req.body.title
            : req.body.title?.en || req.body.title?.hi || "";

      // Ensure all Hindi fields are updated
      const updateData = {
        ...req.body,
        ...(normalizedTitle !== undefined ? { title: normalizedTitle } : {}),
        // Ensure locationArrHi is updated
        locationArrHi: req.body.locationArrHi !== undefined ? req.body.locationArrHi : posting.locationArrHi,
        // Ensure feeStructure is updated
        feeStructure: req.body.feeStructure || posting.feeStructure || {},
        // Ensure advertisement files are updated
        advertisementFile: req.body.advertisementFile !== undefined ? req.body.advertisementFile : posting.advertisementFile,
        advertisementFileHi: req.body.advertisementFileHi !== undefined ? req.body.advertisementFileHi : posting.advertisementFileHi,
      };

      Object.assign(posting, updateData);
      await posting.save();

      res.json({
        success: true,
        message: "Job posting updated successfully",
        data: { posting },
      });
    } catch (error) {
      console.error("Update job posting error:", error);
      res.status(500).json({
        error: "Failed to update job posting",
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/job-postings/:id
 * Delete job posting (admin only)
 */
router.delete("/:id", async (req, res) => {
  try {
    // Only admin can delete job postings
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can delete job postings",
      });
    }

    const posting = await JobPosting.findById(req.params.id);

    if (!posting) {
      return res.status(404).json({
        error: "Job posting not found",
      });
    }

    await JobPosting.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Job posting deleted successfully",
    });
  } catch (error) {
    console.error("Delete job posting error:", error);
    res.status(500).json({
      error: "Failed to delete job posting",
      message: error.message,
    });
  }
});

export default router;
