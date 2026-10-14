import express from "express";
import { getAllCertificates, createCertificate, deleteCertificate } from "../controllers/customCertificateController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);
router.use(authorize("admin", "superadmin", "staff"));

router.route("/").get(getAllCertificates).post(createCertificate);
router.route("/:id").delete(deleteCertificate);

export default router;
