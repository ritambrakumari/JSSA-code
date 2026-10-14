import express from "express";
import { body, validationResult } from "express-validator";
import QuestionBank from "../models/QuestionBank.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);

const buildSearchQuery = ({ status, difficulty, subject, search }) => {
  const query = {};

  if (status && status !== "all") query.status = status;
  if (difficulty && difficulty !== "all") query.difficulty = difficulty;
  if (subject && subject !== "all") query.subject = subject;

  if (search) {
    query.$or = [
      { question: { $regex: search, $options: "i" } },
      { questionHi: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { tags: { $elemMatch: { $regex: search, $options: "i" } } },
    ];
  }

  return query;
};

const sanitizeOptions = (options) =>
  Array.isArray(options)
    ? options.map((opt) => String(opt).trim()).filter(Boolean)
    : [];

/**
 * GET /api/question-bank
 * List questions (public)
 */
router.get("/", async (req, res) => {
  try {
    const { status, difficulty, subject, search, page = 1, limit = 100 } =
      req.query;
    const query = buildSearchQuery({ status, difficulty, subject, search });
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    
    // If limit is "0", treat as no limit (capped at 10000 for safety)
    let limitNum = parseInt(limit, 10);
    if (limit === "0") {
      limitNum = 10000;
    } else {
      limitNum = Math.min(Math.max(limitNum || 100, 1), 1000);
    }

    const skip = (pageNum - 1) * limitNum;

    const [questions, total] = await Promise.all([
      QuestionBank.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("createdBy", "email role"),
      QuestionBank.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get question bank error:", error);
    res.status(500).json({
      error: "Failed to fetch question bank",
      message: error.message,
    });
  }
});

/**
 * GET /api/question-bank/:id
 * Get single question (public)
 */
router.get("/:id", async (req, res) => {
  try {
    const question = await QuestionBank.findById(req.params.id).populate(
      "createdBy",
      "email role",
    );

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({
      success: true,
      data: { question },
    });
  } catch (error) {
    console.error("Get question by id error:", error);
    res.status(500).json({
      error: "Failed to fetch question",
      message: error.message,
    });
  }
});

// Mutations require authentication
//router.use(authenticate);

const createValidation = [
  body("question").notEmpty().withMessage("Question is required"),
  body("subject").notEmpty().withMessage("Subject is required"),
  body("difficulty")
    .isIn(["Easy", "Medium", "Hard"])
    .withMessage("Difficulty must be Easy, Medium, or Hard"),
  body("options")
    .isArray({ min: 2 })
    .withMessage("At least 2 options are required"),
  body("correctAnswer").notEmpty().withMessage("Correct answer is required"),
];

/**
 * POST /api/question-bank
 * Create question (admin only)
 */
router.post("/", createValidation, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can create questions",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        errors: errors.array(),
      });
    }

    const options = sanitizeOptions(req.body.options);
    const optionsHi = sanitizeOptions(req.body.optionsHi);
    const correctAnswer = String(req.body.correctAnswer || "").trim();
    if (!options.includes(correctAnswer)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Correct answer must match one of the options.",
      });
    }

    const question = await QuestionBank.create({
      question: String(req.body.question).trim(),
      questionHi: String(req.body.questionHi || "").trim(),
      subject: String(req.body.subject || "").trim(),
      difficulty: req.body.difficulty,
      options,
      optionsHi: optionsHi.length === options.length ? optionsHi : options,
      correctAnswer,
      explanation: String(req.body.explanation || "").trim(),
      explanationHi: String(req.body.explanationHi || "").trim(),
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
      status: req.body.status === "active" ? "active" : "draft",
      usedInPapers: Number(req.body.usedInPapers || 0),
      createdDate: req.body.createdDate ? new Date(req.body.createdDate) : new Date(),
      createdBy: req.user.id,
    });

    await question.populate("createdBy", "email role");

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: { question },
    });
  } catch (error) {
    console.error("Create question error:", error);
    res.status(500).json({
      error: "Failed to create question",
      message: error.message,
    });
  }
});

/**
 * PUT /api/question-bank/:id
 * Update question (admin only)
 */
router.put("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can update questions",
      });
    }

    const question = await QuestionBank.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    if (req.body.question !== undefined) {
      question.question = String(req.body.question).trim();
    }
    if (req.body.questionHi !== undefined) {
      question.questionHi = String(req.body.questionHi).trim();
    }
    if (req.body.subject !== undefined) question.subject = String(req.body.subject).trim();
    if (req.body.difficulty !== undefined) question.difficulty = req.body.difficulty;
    if (req.body.explanation !== undefined) {
      question.explanation = String(req.body.explanation).trim();
    }
    if (req.body.explanationHi !== undefined) {
      question.explanationHi = String(req.body.explanationHi).trim();
    }
    if (req.body.status !== undefined) {
      question.status = req.body.status === "active" ? "active" : "draft";
    }
    if (req.body.usedInPapers !== undefined) {
      question.usedInPapers = Number(req.body.usedInPapers);
    }
    if (req.body.createdDate !== undefined) {
      question.createdDate = new Date(req.body.createdDate);
    }

    if (req.body.tags !== undefined) {
      question.tags = Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [];
    }

    if (req.body.options !== undefined) {
      const options = sanitizeOptions(req.body.options);
      if (options.length < 2) {
        return res.status(400).json({
          error: "Validation failed",
          message: "At least 2 options are required",
        });
      }
      question.options = options;
    }
    if (req.body.optionsHi !== undefined) {
      const optionsHi = sanitizeOptions(req.body.optionsHi);
      question.optionsHi =
        optionsHi.length === question.options.length ? optionsHi : question.options;
    }

    if (req.body.correctAnswer !== undefined) {
      question.correctAnswer = String(req.body.correctAnswer).trim();
    }

    if (!question.options.includes(question.correctAnswer)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Correct answer must match one of the options.",
      });
    }

    await question.save();
    await question.populate("createdBy", "email role");

    res.json({
      success: true,
      message: "Question updated successfully",
      data: { question },
    });
  } catch (error) {
    console.error("Update question error:", error);
    res.status(500).json({
      error: "Failed to update question",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/question-bank/:id
 * Delete question (admin only)
 */
router.delete("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can delete questions",
      });
    }

    const question = await QuestionBank.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    await QuestionBank.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({
      error: "Failed to delete question",
      message: error.message,
    });
  }
});

export default router;
