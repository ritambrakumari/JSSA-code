import express from "express";
import {
  logCalculation,
  getMyHistory,
  getAdminReport,
} from "../controllers/calculatorController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// CardHolder routes
router.post("/log", logCalculation);
router.get("/my-history", getMyHistory);

// Admin / Staff report (optional, for future dashboard)
router.get("/admin-report", getAdminReport);

export default router;
