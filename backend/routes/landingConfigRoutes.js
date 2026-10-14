import express from "express";
import { getLandingConfig, updateLandingConfig, getWhatsappChannel } from "../controllers/landingConfigController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/whatsapp-channel", getWhatsappChannel);

router.route("/").get(getLandingConfig).put(authenticate, authorize("admin", "superadmin"), updateLandingConfig);

export default router;
