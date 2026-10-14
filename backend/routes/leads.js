import express from "express";
const router = express.Router();
import Lead from "../models/Lead.js";
import Employee from "../models/Employee.js";
import GoalConfig from "../models/GoalConfig.js";
import Transaction from "../models/Transaction.js";
import { authenticate, authorize } from "../middleware/auth.js";
import mongoose from "mongoose";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

/**
 * @route   GET /api/leads
 * @desc    Get all leads (Admin: all, Employee: created by self)
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "all";
    const role = req.query.role || "all";
    const state = req.query.state || "all";
    const district = req.query.district || "all";
    const block = req.query.block || "all";
    const panchayat = req.query.panchayat || "all";
    const isExport = req.query.export === "true";

    let query = { isArchived: false };
    
    // Role-based restriction
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      query.createdBy = req.user.id;
    } else {
      // Add Location and Role Filtering for admins
      if (role !== "all" || state !== "all" || district !== "all" || block !== "all" || panchayat !== "all") {
        let empMatch = {};
        if (role !== "all") empMatch.role = role.toUpperCase();
        if (state !== "all") empMatch.workingState = { $regex: new RegExp(`^${state}$`, "i") };
        if (district !== "all") empMatch.workingDistrict = { $regex: new RegExp(`^${district}$`, "i") };
        
        let blockIds = [];
        let panchayatIds = [];

        if (block !== "all") {
          const Block = mongoose.models.Block || mongoose.model("Block");
          const matchedBlocks = await Block.find({ name: { $regex: new RegExp(`^${block}$`, "i") } }).select("_id");
          blockIds = matchedBlocks.map(b => b._id);
          empMatch.workingBlock = { $in: blockIds };
        }
        if (panchayat !== "all") {
          const Panchayat = mongoose.models.Panchayat || mongoose.model("Panchayat");
          const matchedPanchayats = await Panchayat.find({ name: { $regex: new RegExp(`^${panchayat}$`, "i") } }).select("_id");
          panchayatIds = matchedPanchayats.map(p => p._id);
          empMatch.workingPanchayat = { $in: panchayatIds };
        }

        const matchingEmps = await Employee.find(empMatch).select("userId");
        query.createdBy = { $in: matchingEmps.map(e => e.userId) };
      }
    }

    // Server-side filtering
    if (status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } }
      ];
    }

    if (isExport) {
      const leadsForExport = await Lead.find(query)
        .sort({ createdAt: -1 })
        .populate("createdBy", "name email phone");
      
      const userIds = leadsForExport.map(l => l.createdBy?._id).filter(Boolean);
      const emps = await Employee.find({ userId: { $in: userIds } }).select("userId name role designation");
      const empMap = {};
      emps.forEach(e => empMap[e.userId.toString()] = e);

      const roleMap = {
        RM: "Regional Manager (RM)",
        ZC: "Zonal Coordinator (ZC)",
        DM: "District Manager",
        BS: "Block Supervisor",
        PE: "Panchayat Executive"
      };

      const exportData = leadsForExport.map(lead => {
        const authorUser = lead.createdBy;
        const emp = authorUser ? empMap[authorUser._id.toString()] : null;
        let displayRole = emp?.role ? (roleMap[emp.role.toUpperCase()] || emp.role) : "N/A";

        return {
          "Date": lead.createdAt.toISOString().split('T')[0],
          "Prospect Name": lead.name,
          "Contact Number": lead.phone,
          "Alt Contact": lead.altPhone || "-",
          "Lead Category": lead.type,
          "Full Address": lead.address,
          "Status": lead.status,
          "Submitted By (Name)": authorUser?.name || "System Agent",
          "Submitted By (Email)": authorUser?.email || "-",
          "Submitted By (Role)": displayRole
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Live Leads");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      
      res.setHeader("Content-Disposition", `attachment; filename=Leads_Live_Export.xlsx`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(excelBuffer);
    }

    const totalLeads = await Lead.countDocuments(query);
    let leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email phone")
      .populate("history.updatedBy", "name role email");

    // Fix for "Unknown Author": Get name from Employee if User lacks it
    const userIds = leads.map(l => l.createdBy?._id).filter(Boolean);
    const emps = await Employee.find({ userId: { $in: userIds } }).select("userId name");
    const empMap = {};
    emps.forEach(e => empMap[e.userId.toString()] = e.name);

    leads = leads.map(lead => {
      const leadObj = lead.toObject();
      if (leadObj.createdBy && !leadObj.createdBy.name && empMap[leadObj.createdBy._id.toString()]) {
        leadObj.createdBy.name = empMap[leadObj.createdBy._id.toString()];
      }
      return leadObj;
    });

    res.json({
      success: true,
      data: leads,
      pagination: {
        total: totalLeads,
        pages: Math.ceil(totalLeads / limit),
        currentPage: page,
        limit
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/leads/archived
 * @desc    Get archived leads (Admin only)
 */
router.get("/archived", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "all";
    const role = req.query.role || "all";
    const state = req.query.state || "all";
    const district = req.query.district || "all";
    const block = req.query.block || "all";
    const panchayat = req.query.panchayat || "all";
    const isExport = req.query.export === "true";

    let query = { isArchived: true };

    if (status !== "all") {
      query.status = status;
    }

    if (role !== "all" || state !== "all" || district !== "all" || block !== "all" || panchayat !== "all") {
      let empMatch = {};
      if (role !== "all") empMatch.role = role.toUpperCase();
      if (state !== "all") empMatch.workingState = { $regex: new RegExp(`^${state}$`, "i") };
      if (district !== "all") empMatch.workingDistrict = { $regex: new RegExp(`^${district}$`, "i") };
      
      let blockIds = [];
      let panchayatIds = [];

      if (block !== "all") {
        const Block = mongoose.models.Block || mongoose.model("Block");
        const matchedBlocks = await Block.find({ name: { $regex: new RegExp(`^${block}$`, "i") } }).select("_id");
        blockIds = matchedBlocks.map(b => b._id);
        empMatch.workingBlock = { $in: blockIds };
      }
      if (panchayat !== "all") {
        const Panchayat = mongoose.models.Panchayat || mongoose.model("Panchayat");
        const matchedPanchayats = await Panchayat.find({ name: { $regex: new RegExp(`^${panchayat}$`, "i") } }).select("_id");
        panchayatIds = matchedPanchayats.map(p => p._id);
        empMatch.workingPanchayat = { $in: panchayatIds };
      }

      const matchingEmps = await Employee.find(empMatch).select("userId");
      query.createdBy = { $in: matchingEmps.map(e => e.userId) };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } }
      ];
    }

    if (isExport) {
      const leadsForExport = await Lead.find(query)
        .sort({ updatedAt: -1 })
        .populate("createdBy", "name email phone");
      
      const userIds = leadsForExport.map(l => l.createdBy?._id).filter(Boolean);
      const emps = await Employee.find({ userId: { $in: userIds } }).select("userId name role designation");
      const empMap = {};
      emps.forEach(e => empMap[e.userId.toString()] = e);

      const roleMap = {
        RM: "Regional Manager (RM)",
        ZC: "Zonal Coordinator (ZC)",
        DM: "District Manager",
        BS: "Block Supervisor",
        PE: "Panchayat Executive"
      };

      const exportData = leadsForExport.map(lead => {
        const authorUser = lead.createdBy;
        const emp = authorUser ? empMap[authorUser._id.toString()] : null;
        let displayRole = emp?.role ? (roleMap[emp.role.toUpperCase()] || emp.role) : "N/A";

        return {
          "Date": lead.createdAt.toISOString().split('T')[0],
          "Prospect Name": lead.name,
          "Contact Number": lead.phone,
          "Alt Contact": lead.altPhone || "-",
          "Lead Category": lead.type,
          "Full Address": lead.address,
          "Status": lead.status,
          "Submitted By (Name)": authorUser?.name || "System Agent",
          "Submitted By (Email)": authorUser?.email || "-",
          "Submitted By (Role)": displayRole
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Archived Leads");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      
      res.setHeader("Content-Disposition", `attachment; filename=Leads_Archived_Export.xlsx`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(excelBuffer);
    }

    const totalLeads = await Lead.countDocuments(query);
    let leads = await Lead.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email phone")
      .populate("history.updatedBy", "name role email");

    // Fix for "Unknown Author": Get name from Employee if User lacks it
    const userIds = leads.map(l => l.createdBy?._id).filter(Boolean);
    const emps = await Employee.find({ userId: { $in: userIds } }).select("userId name");
    const empMap = {};
    emps.forEach(e => empMap[e.userId.toString()] = e.name);

    leads = leads.map(lead => {
      const leadObj = lead.toObject();
      if (leadObj.createdBy && !leadObj.createdBy.name && empMap[leadObj.createdBy._id.toString()]) {
        leadObj.createdBy.name = empMap[leadObj.createdBy._id.toString()];
      }
      return leadObj;
    });

    res.json({
      success: true,
      data: leads,
      pagination: {
        total: totalLeads,
        pages: Math.ceil(totalLeads / limit),
        currentPage: page,
        limit
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/leads
 * @desc    Create a new lead (Employee/Admin)
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { name, type, phone, altPhone, email, profileImage, address, notes } = req.body;
    
    const lead = new Lead({
      name,
      type,
      phone,
      altPhone,
      email,
      profileImage,
      address,
      notes,
      createdBy: req.user.id,
      status: "Pending"
    });

    await lead.save();
    const populatedLead = await Lead.findById(lead._id).populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      data: populatedLead,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * @route   PATCH /api/leads/:id/status
 * @desc    Update lead status (Admin only)
 */
router.patch("/:id/status", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const { status, callRemark } = req.body;
    if (!["Follow Up", "Qualified", "Disqualified"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }

    // Logic: If marking as Qualified, check for earnings
    if (status === "Qualified" && lead.status !== "Qualified") {
      const employee = await Employee.findOne({ userId: lead.createdBy });
      if (employee) {
        // Get GoalConfig for this employee's role
        const config = await GoalConfig.findOne({ role: employee.role });
        if (config && config.leadEarningEnabled && config.individualLeadEarning > 0) {
          const amount = config.individualLeadEarning;
          
          // Credit Earnings Wallet (salaryWallet)
          employee.salaryWallet = (employee.salaryWallet || 0) + amount;
          await employee.save();

          // Log Transaction
          await Transaction.create({
            userId: employee.userId,
            employeeId: employee._id,
            amount: amount,
            type: "CREDIT_LEAD",
            status: "SUCCESS",
            remarks: `Lead Earning: ${lead.name}`,
            metadata: { leadId: lead._id }
          });

          console.log(`💰 Credited ₹${amount} to ${employee.name} for Qualified Lead.`);
        }
      }
    }

    lead.status = status;
    if (callRemark !== undefined) {
      lead.callRemark = callRemark;
    }

    // Push to history
    lead.history.push({
      status: status,
      remark: callRemark || "Status updated",
      updatedBy: req.user.id,
      date: new Date()
    });

    await lead.save();

    res.json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error("Lead Status Update Error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * @route   PATCH /api/leads/:id/archive
 * @desc    Archive or Restore a lead (Admin only)
 */
router.patch("/:id/archive", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const { isArchived } = req.body;
    
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { isArchived },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
