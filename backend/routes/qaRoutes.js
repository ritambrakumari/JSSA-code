import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  askQuestion,
  getMyQuestions,
  getAllQuestions,
  answerQuestion,
  deleteQuestion,
  getRMQuestions
} from "../controllers/qaController.js";

const router = express.Router();

// Employee Routes
router.post("/ask", authenticate, askQuestion);
router.get("/my-questions", authenticate, getMyQuestions);

// RM Routes
router.get("/rm/all", authenticate, authorize(["employee", "admin", "superadmin", "RM", "rm"]), getRMQuestions);

// Admin Routes (Restricted to Staff/Admin)
router.get("/admin/all", authenticate, authorize(["admin", "superadmin", "staff"]), getAllQuestions);
router.put("/admin/answer/:id", authenticate, authorize(["admin", "superadmin", "staff", "employee", "RM", "rm"]), answerQuestion);
router.delete("/admin/:id", authenticate, authorize(["admin", "superadmin", "staff"]), deleteQuestion);

export default router;
