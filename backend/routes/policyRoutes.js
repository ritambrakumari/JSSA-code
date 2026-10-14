import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadPDF } from "../middleware/upload.js";
import {
  getPolicies,
  uploadPolicies,
  updatePolicy,
  deletePolicy,
} from "../controllers/policyController.js";

const router = express.Router();

// @route   GET /api/policies
// @desc    Get all policies
// @access  Private (Admin, Employee, CardHolder)
router.get("/", authenticate, getPolicies);

// @route   POST /api/policies/upload
// @desc    Upload multiple policies
// @access  Private (Admin Only)
router.post(
  "/upload",
  authenticate,
  authorize(["admin", "superadmin", "staff"]),
  uploadPDF.array("files", 20),
  uploadPolicies
);

// @route   PUT /api/policies/:id
// @desc    Update policy details (e.g., name/title)
// @access  Private (Admin Only)
router.put(
  "/:id",
  authenticate,
  authorize(["admin", "superadmin", "staff"]),
  uploadPDF.single("file"),
  updatePolicy
);

// @route   DELETE /api/policies/:id
// @desc    Delete policy
// @access  Private (Admin Only)
router.delete(
  "/:id",
  authenticate,
  authorize(["admin", "superadmin", "staff"]),
  deletePolicy
);

export default router;
