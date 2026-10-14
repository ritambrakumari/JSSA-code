import express from "express";
import Refund from "../models/Refund.js";
import Transaction from "../models/Transaction.js";
import Application from "../models/Application.js";
import Employee from "../models/Employee.js";
import JobPosting from "../models/JobPosting.js";
import { authenticate, authorize } from "../middleware/auth.js";

// Helper to calculate fee (duplicated from payments logic for safety)
const calculateJobFee = (jobPosting, gender, category) => {
  if (!jobPosting || !gender || !category) return 0;
  const feeKey = `${gender}_${category}`;
  const feeAmount = jobPosting.feeStructure?.[feeKey] || "0";
  return parseFloat(feeAmount.toString().replace(/[₹,]/g, "")) || 0;
};

const router = express.Router();

/**
 * POST /api/refunds/request
 * Submit a new refund request
 */
router.post("/request", authenticate, async (req, res) => {
  try {
    const { transactionId, reason, isMou } = req.body;

    if (!transactionId || !reason) {
      return res.status(400).json({ error: "Transaction/Application ID and reason are required" });
    }

    // Try finding in Transaction model first (Employee wallet/card transactions)
    let transaction = await Transaction.findOne({ _id: transactionId, userId: req.user.id });

    let amount = 0;
    let appId = null;
    let empId = null;
    let txId = null;

    if (transaction) {
      amount = transaction.amount;
      empId = transaction.employeeId;
      txId = transaction._id;

      // Try to link application if possible
      const app = await Application.findOne({ createdBy: req.user.id }).sort({ createdAt: -1 });
      if (app) appId = app._id;
    } else {
      // Try finding in Application model (Applicant fees)
      const application = await Application.findOne({ _id: transactionId, createdBy: req.user.id }).populate("jobPostingId");
      if (!application) {
        return res.status(404).json({ error: "Transaction or Application not found or unauthorized" });
      }

      // Ensure application is paid
      if (application.paymentStatus !== "paid" && application.mouStatus !== "paid") {
        return res.status(400).json({ error: "No successful payment found for this application" });
      }

      // Get amount with fallback calculation
      if (isMou) {
        amount = application.mouAmount || 0;
      } else if (application.paymentStatus === "paid") {
        amount = application.amount || 0;
        if (amount === 0 && application.jobPostingId) {
          amount = calculateJobFee(application.jobPostingId, application.gender, application.category);
        }
      } else if (application.mouStatus === "paid") {
        // If isMou not specified but only MOU is paid, fallback to MOU
        amount = application.mouAmount || 0;
      }

      appId = application._id;

      // If it's an employee MOU payment, find employee ID
      if (application.mouStatus === "paid") {
        const employee = await Employee.findOne({ userId: req.user.id });
        if (employee) empId = employee._id;
      }
    }

    // Check if a request already exists for this specific payment type
    const existingRefund = await Refund.findOne({
      $or: [
        { transactionId: txId, transactionId: { $ne: null } },
        { applicationId: appId, applicationId: { $ne: null }, amount: amount }
      ]
    });

    if (existingRefund) {
      return res.status(400).json({ error: "Refund request already exists for this transaction" });
    }

    const refund = await Refund.create({
      userId: req.user.id,
      transactionId: txId,
      applicationId: appId,
      employeeId: empId,
      amount,
      reason,
      status: "Pending"
    });

    res.status(201).json({
      success: true,
      message: "Refund request submitted successfully",
      data: refund
    });
  } catch (error) {
    console.error("Refund request error:", error);
    res.status(500).json({ error: "Failed to submit refund request", message: error.message });
  }
});

/**
 * GET /api/refunds/my-requests
 * Get all refund requests for current user
 */
router.get("/my-requests", authenticate, async (req, res) => {
  try {
    const requests = await Refund.find({ userId: req.user.id })
      .populate("transactionId")
      .populate("applicationId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error("Fetch my-refunds error:", error);
    res.status(500).json({ error: "Failed to fetch refund requests" });
  }
});

/**
 * GET /api/refunds/admin/all
 * Admin: Get all refund requests
 */
router.get("/admin/all", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const requests = await Refund.find()
      .populate("userId", "email phone")
      .populate("transactionId")
      .populate("applicationId")
      .populate("employeeId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error("Admin fetch refunds error:", error);
    res.status(500).json({ error: "Failed to fetch all refund requests" });
  }
});

/**
 * PATCH /api/refunds/admin/status/:id
 * Admin: Update refund status
 */
router.patch("/admin/status/:id", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks, refundRefId } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const refund = await Refund.findById(id);
    if (!refund) {
      return res.status(404).json({ error: "Refund request not found" });
    }

    refund.status = status;
    refund.adminRemarks = adminRemarks || refund.adminRemarks;
    if (refundRefId) refund.refundRefId = refundRefId;
    refund.processedAt = new Date();

    await refund.save();

    res.json({
      success: true,
      message: `Refund request ${status.toLowerCase()} successfully`,
      data: refund
    });
  } catch (error) {
    console.error("Update refund status error:", error);
    res.status(500).json({ error: "Failed to update refund status" });
  }
});

export default router;
