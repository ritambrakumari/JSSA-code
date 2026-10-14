import express from "express";
import { cardController } from "../controllers/cardController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All card routes require authentication
router.use(authenticate);

// Employee/Admin Routes
router.post("/create", cardController.createCard);
router.get("/list", cardController.getAllCards);
router.get("/filters/counts", cardController.getFilterCounts);
router.get("/export-csv", cardController.exportCardsCSV);
router.get("/details/:id", cardController.getCardById);
router.put("/edit/:id", cardController.updateCard);
router.post("/check-duplicate", cardController.checkDuplicate);

// Admin Manual Card Management Routes
router.post("/admin/create", cardController.adminCreateCard);
router.put("/admin/edit/:id", cardController.adminUpdateCard);
router.delete("/admin/delete/:id", cardController.adminDeleteCard);

// CardHolder Routes
router.get("/my-card", cardController.getMyCard);

export default router;
