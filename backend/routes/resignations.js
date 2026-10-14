import express from "express";
import Resignation from "../models/Resignation.js";
import Employee from "../models/Employee.js";
import Application from "../models/Application.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const router = express.Router();

function addCalendarMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysBetween(from, to) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

async function getEmployeeContext(userId) {
  const employee = await Employee.findOne({ userId });
  if (!employee) return null;

  const application = await Application.findOne({ createdBy: userId }).sort({ createdAt: -1 });

  let mouPaidAt = null;
  let eligibilityBaseDate = new Date(employee.createdAt);

  if (application?.mouStatus === "paid") {
    mouPaidAt = application.mouPaidAt || application.updatedAt;
    eligibilityBaseDate = mouPaidAt;
  }

  const eligibleFrom = addCalendarMonths(eligibilityBaseDate, 3);
  const now = new Date();
  const canSubmit = now >= eligibleFrom;

  return {
    employee,
    application,
    mouPaidAt,
    joinDate: employee.createdAt,
    eligibilityBaseDate,
    eligibleFrom,
    canSubmit,
    daysRemaining: canSubmit ? 0 : daysBetween(now, eligibleFrom),
  };
}

/**
 * GET /api/resignations/eligibility
 */
router.get("/eligibility", authenticate, authorize("employee"), async (req, res) => {
  try {
    const ctx = await getEmployeeContext(req.user.id);
    if (!ctx) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    const pending = await Resignation.findOne({
      userId: req.user.id,
      status: "Pending",
    });

    res.json({
      success: true,
      data: {
        mouPaidAt: ctx.mouPaidAt,
        joinDate: ctx.joinDate,
        eligibilityBaseDate: ctx.eligibilityBaseDate,
        eligibleFrom: ctx.eligibleFrom,
        canSubmit: ctx.canSubmit && !pending && ctx.employee.status === "Active",
        daysRemaining: ctx.daysRemaining,
        hasPendingRequest: !!pending,
        employeeStatus: ctx.employee.status,
        mouPaid: ctx.application?.mouStatus === "paid",
      },
    });
  } catch (error) {
    console.error("Resignation eligibility error:", error);
    res.status(500).json({ error: "Failed to fetch eligibility", message: error.message });
  }
});

/**
 * POST /api/resignations/request
 */
router.post("/request", authenticate, authorize("employee"), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ error: "Reason is required" });
    }

    const ctx = await getEmployeeContext(req.user.id);
    if (!ctx) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    if (ctx.employee.status !== "Active") {
      return res.status(400).json({ error: "Only active employees can submit a resignation request" });
    }

    if (!ctx.canSubmit) {
      return res.status(400).json({
        error: "You are not yet eligible to resign",
        eligibleFrom: ctx.eligibleFrom,
      });
    }

    const pending = await Resignation.findOne({
      userId: req.user.id,
      status: "Pending",
    });
    if (pending) {
      return res.status(400).json({ error: "You already have a pending resignation request" });
    }

    const resignation = await Resignation.create({
      userId: req.user.id,
      employeeId: ctx.employee._id,
      reason: reason.trim(),
      status: "Pending",
      eligibilityBaseDate: ctx.eligibilityBaseDate,
      eligibleFrom: ctx.eligibleFrom,
      mouPaidAt: ctx.mouPaidAt,
      submittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Resignation request submitted successfully",
      data: resignation,
    });
  } catch (error) {
    console.error("Resignation request error:", error);
    res.status(500).json({ error: "Failed to submit resignation request", message: error.message });
  }
});

/**
 * GET /api/resignations/my-requests
 */
router.get("/my-requests", authenticate, authorize("employee"), async (req, res) => {
  try {
    const requests = await Resignation.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Fetch my-resignations error:", error);
    res.status(500).json({ error: "Failed to fetch resignation requests" });
  }
});

/**
 * PATCH /api/resignations/my-requests/:id/withdraw
 */
router.patch("/my-requests/:id/withdraw", authenticate, authorize("employee"), async (req, res) => {
  try {
    const resignation = await Resignation.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: "Pending",
    });
    if (!resignation) {
      return res.status(404).json({ error: "Pending resignation request not found" });
    }

    resignation.status = "Withdrawn";
    resignation.processedAt = new Date();
    await resignation.save();

    res.json({
      success: true,
      message: "Resignation request withdrawn",
      data: resignation,
    });
  } catch (error) {
    console.error("Withdraw resignation error:", error);
    res.status(500).json({ error: "Failed to withdraw resignation request" });
  }
});

/**
 * GET /api/resignations/admin/all
 */
router.get(
  "/admin/all",
  authenticate,
  authorize("admin", "superadmin", "staff"),
  async (req, res) => {
    try {
      const { status, search, role, state, district, block, panchayat, export: isExport } = req.query;
      const filter = {};
      if (status && status !== "all") {
        filter.status = status;
      }

      // Add Location and Role Filtering
      if (role || state || district || block || panchayat || search) {
        let empMatch = {};
        if (role && role !== "all") empMatch.role = role.toUpperCase();
        if (state && state !== "all") empMatch.workingState = { $regex: new RegExp(`^${state}$`, "i") };
        if (district && district !== "all") empMatch.workingDistrict = { $regex: new RegExp(`^${district}$`, "i") };
        if (search) {
           empMatch.name = { $regex: new RegExp(search, "i") };
        }
        
        let blockIds = [];
        let panchayatIds = [];

        if (block && block !== "all") {
          const Block = mongoose.models.Block || mongoose.model("Block");
          const matchedBlocks = await Block.find({ name: { $regex: new RegExp(`^${block}$`, "i") } }).select("_id");
          blockIds = matchedBlocks.map(b => b._id);
          empMatch.workingBlock = { $in: blockIds };
        }
        if (panchayat && panchayat !== "all") {
          const Panchayat = mongoose.models.Panchayat || mongoose.model("Panchayat");
          const matchedPanchayats = await Panchayat.find({ name: { $regex: new RegExp(`^${panchayat}$`, "i") } }).select("_id");
          panchayatIds = matchedPanchayats.map(p => p._id);
          empMatch.workingPanchayat = { $in: panchayatIds };
        }

        const matchingEmps = await Employee.find(empMatch).select("_id");
        filter.employeeId = { $in: matchingEmps.map(e => e._id) };
      }

      const requests = await Resignation.find(filter)
        .populate("userId", "email phone")
        .populate({
          path: "employeeId",
          select: "name designation role status createdAt",
        })
        .populate("approvedBy", "email")
        .sort({ createdAt: -1 });

      const roleMap = {
        RM: "Regional Manager (RM)",
        ZC: "Zonal Coordinator (ZC)",
        DM: "District Manager",
        BS: "Block Supervisor",
        PE: "Panchayat Executive"
      };

      const enrichedRequests = requests.map(item => {
        const itemObj = item.toObject();
        let displayDesignation = item.employeeId?.designation || "Unknown";
        if (item.employeeId?.role) {
          displayDesignation = roleMap[item.employeeId.role.toUpperCase()] || displayDesignation;
        }
        itemObj.employeeId = itemObj.employeeId || {};
        itemObj.employeeId.designation = displayDesignation;
        return itemObj;
      });

      if (isExport === 'true') {
        const exportData = enrichedRequests.map(item => ({
          "Date": item.createdAt.toISOString().split('T')[0],
          "Employee Name": item.employeeId?.name || "Unknown",
          "Role": item.employeeId?.role || "Unknown",
          "Designation": item.employeeId?.designation || "Unknown",
          "Eligible From": item.effectiveDate ? item.effectiveDate.toISOString().split('T')[0] : "-",
          "MOU Paid": item.mouAmountPaid || "-",
          "Reason": item.reason || "N/A",
          "Status": item.status,
          "Admin Remarks": item.adminRemarks || "N/A",
          "Submitted By": item.userId?.email || "N/A"
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Resignations");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
        
        res.setHeader("Content-Disposition", `attachment; filename=Resignations_Export.xlsx`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        return res.send(excelBuffer);
      }

      res.json({ success: true, data: enrichedRequests });
    } catch (error) {
      console.error("Admin fetch resignations error:", error);
      res.status(500).json({ error: "Failed to fetch resignation requests" });
    }
  }
);

/**
 * PATCH /api/resignations/admin/status/:id
 */
router.patch(
  "/admin/status/:id",
  authenticate,
  authorize("admin", "superadmin", "staff"),
  async (req, res) => {
    try {
      const { status, adminRemarks } = req.body;
      if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      if (!adminRemarks?.trim()) {
        return res.status(400).json({ error: "Admin remarks are required" });
      }

      const resignation = await Resignation.findById(req.params.id);
      if (!resignation) {
        return res.status(404).json({ error: "Resignation request not found" });
      }
      if (resignation.status !== "Pending") {
        return res.status(400).json({ error: "Only pending requests can be updated" });
      }

      resignation.status = status;
      resignation.adminRemarks = adminRemarks.trim();
      resignation.processedAt = new Date();
      resignation.approvedBy = req.user.id;

      if (status === "Approved") {
        const employee = await Employee.findById(resignation.employeeId);
        if (!employee) {
          return res.status(404).json({ error: "Employee not found" });
        }
        employee.status = "Resigned";
        await employee.save();
      }

      await resignation.save();

      res.json({
        success: true,
        message: `Resignation request ${status.toLowerCase()} successfully`,
        data: resignation,
      });
    } catch (error) {
      console.error("Update resignation status error:", error);
      res.status(500).json({ error: "Failed to update resignation status" });
    }
  }
);

export default router;
