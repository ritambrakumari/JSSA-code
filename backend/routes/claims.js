import express from "express";
import { 
  submitClaim, 
  reApplyClaim,
  getMyClaims, 
  getClaimById,
  getAllClaims, 
  updateClaimStatus,
  approveAmount,
  payClaim,
  deleteClaim
} from "../controllers/claimController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadPDF } from "../middleware/upload.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure claims uploads directory exists
const claimsDir = path.join(__dirname, "../uploads/claims");
if (!fs.existsSync(claimsDir)) {
  fs.mkdirSync(claimsDir, { recursive: true });
}

// Multer configuration for local storage of claims evidence
import multer from "multer";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, claimsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `claim_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const mimetype = allowed.test(file.mimetype);
    if (mimetype) cb(null, true);
    else cb(new Error("Only images and PDFs are allowed"));
  }
});

const cpUpload = upload.fields([
  { name: 'healthCardCopy', maxCount: 1 },
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 },
  { name: 'panFront', maxCount: 1 },
  { name: 'bankPassbook', maxCount: 1 },
  { name: 'doctorReport', maxCount: 1 },
  { name: 'consultationFeeBill', maxCount: 1 },
  { name: 'dischargeSummary', maxCount: 1 },
  { name: 'hospitalBills', maxCount: 1 },
  { name: 'diagnosticReports', maxCount: 1 },
  { name: 'labBills', maxCount: 1 },
  { name: 'pharmacyBills', maxCount: 1 },
  { name: 'firCopy', maxCount: 1 },
  { name: 'passportPhotos', maxCount: 3 },
  { name: 'claimForm', maxCount: 1 },
  { name: 'evidence', maxCount: 1 } // Legacy
]);

// Card Holder Routes
router.post("/submit", authenticate, cpUpload, submitClaim);
router.put("/re-apply/:id", authenticate, cpUpload, reApplyClaim);
router.get("/my-claims", authenticate, getMyClaims);
// Admin Routes
router.get("/all", authenticate, authorize(["admin", "superadmin", "staff", "employee"]), getAllClaims);
router.put("/status/:id", authenticate, authorize(["admin", "superadmin", "staff", "employee"]), updateClaimStatus);
router.post("/admin/approve-amount/:id", authenticate, authorize(["admin", "superadmin", "staff"]), approveAmount);
router.post("/admin/pay/:id", authenticate, authorize(["admin", "superadmin", "staff"]), upload.single('paymentProof'), payClaim);
router.delete("/:id", authenticate, authorize(["admin", "superadmin", "staff"]), deleteClaim);

// General route (put at the end to prevent shadowing /all)
router.get("/:id", authenticate, getClaimById);

export default router;
