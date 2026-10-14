import express from "express";
import { systemConfigController } from "../controllers/systemConfigController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Publicly available (for price check in frontend) but still authenticated
router.get("/current", authenticate, systemConfigController.getConfig);

// Admin only routes
router.put("/update", authenticate, authorize("admin", "superadmin"), systemConfigController.updateConfig);

export default router;
