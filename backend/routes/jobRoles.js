import express from "express";
import { body, validationResult } from "express-validator";
import JobRole from "../models/JobRole.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/job-roles
 * Get all job roles with optional search
 */
router.get("/", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query.jobTitle = { $regex: search, $options: "i" };
    }

    const roles = await JobRole.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: roles });
  } catch (error) {
    console.error("Fetch Job Roles Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/job-roles
 * Create a new job role
 */
router.post(
  "/",
  authenticate,
  authorize(["admin", "superadmin", "staff"]),
  [
    body("jobTitle").notEmpty().withMessage("Job title is required"),
    body("termsConditions").notEmpty().withMessage("Terms and conditions are required"),
    body("permissions").isArray().withMessage("Permissions must be an array"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", errors: errors.array() });
      }

      const { jobTitle, termsConditions, permissions } = req.body;

      // Check for duplicate title
      const existing = await JobRole.findOne({ jobTitle });
      if (existing) {
        return res.status(409).json({ error: "Job role with this title already exists" });
      }

      const newRole = await JobRole.create({
        jobTitle,
        termsConditions,
        permissions,
        createdBy: req.user.id,
      });

      res.status(201).json({ success: true, data: newRole });
    } catch (error) {
      console.error("Create Job Role Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * PUT /api/job-roles/:id
 * Update an existing job role
 */
router.put(
  "/:id",
  authenticate,
  authorize(["admin", "superadmin", "staff"]),
  [
    body("jobTitle").optional().notEmpty().withMessage("Job title cannot be empty"),
    body("termsConditions").optional().notEmpty().withMessage("Terms cannot be empty"),
    body("permissions").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", errors: errors.array() });
      }

      const { jobTitle, termsConditions, permissions, status } = req.body;

      const role = await JobRole.findById(req.params.id);
      if (!role) {
        return res.status(404).json({ error: "Job role not found" });
      }

      if (jobTitle) role.jobTitle = jobTitle;
      if (termsConditions) role.termsConditions = termsConditions;
      if (permissions) role.permissions = permissions;
      if (status) role.status = status;

      await role.save();
      res.json({ success: true, data: role });
    } catch (error) {
      console.error("Update Job Role Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/job-roles/:id
 * Delete a job role
 */
router.delete("/:id", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const role = await JobRole.findByIdAndDelete(req.params.id);
    if (!role) {
      return res.status(404).json({ error: "Job role not found" });
    }
    res.json({ success: true, message: "Job role deleted successfully" });
  } catch (error) {
    console.error("Delete Job Role Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
