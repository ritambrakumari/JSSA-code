import express from "express";
import { pharmacyBillController } from "../controllers/pharmacyBillController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Route accessible to any authenticated user (e.g. Cardholders viewing their bills)
router.get("/prescription/:prescriptionId", authenticate, pharmacyBillController.getBillByPrescription);

// All routes below require authentication and pharmacy role
router.use(authenticate, authorize("pharmacy"));

router.post("/", pharmacyBillController.createBill);
router.get("/", pharmacyBillController.getBills);
router.get("/verify-cardholder/:mobile", pharmacyBillController.verifyCardholder);

export default router;
