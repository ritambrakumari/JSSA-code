import express from "express";
import { 
  requestWithdrawal, 
  approveWithdrawal, 
  rejectWithdrawal, 
  addBankAccount, 
  getMyWithdrawals, 
  adminGetAllWithdrawals,
  getMyBankAccounts,
  getAdminEmployeeRequests,
  requestStaffWithdrawal,
  getStaffWithdrawalHistory,
  revertWithdrawal
} from "../controllers/withdrawalController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Employee Routes
router.post("/request", authenticate, requestWithdrawal);
router.get("/my-requests", authenticate, getMyWithdrawals);
router.post("/bank-accounts", authenticate, addBankAccount);
router.get("/my-bank-accounts", authenticate, getMyBankAccounts);

// Staff Routes
router.post("/staff-request", authenticate, requestStaffWithdrawal);
router.get("/staff-history", authenticate, getStaffWithdrawalHistory);

// Admin Routes
router.get("/admin/all", authenticate, authorize(["admin", "superadmin", "staff"]), adminGetAllWithdrawals);
router.get("/admin/employee-requests/:employeeId", authenticate, authorize(["admin", "superadmin", "staff"]), getAdminEmployeeRequests);
router.post("/admin/approve/:id", authenticate, authorize(["admin", "superadmin", "staff"]), approveWithdrawal);
router.post("/admin/reject/:id", authenticate, authorize(["admin", "superadmin", "staff"]), rejectWithdrawal);
router.post("/admin/revert/:id", authenticate, authorize(["admin", "superadmin", "staff"]), revertWithdrawal);

export default router;
