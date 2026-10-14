import express from "express";
import Camp from "../models/Camp.js";
import CampRequest from "../models/CampRequest.js";
import Employee from "../models/Employee.js";
import Card from "../models/Card.js";
import User from "../models/User.js";
import Block from "../models/Block.js";
import Panchayat from "../models/Panchayat.js";
import { authenticate, authorize } from "../middleware/auth.js";

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

async function buildRequesterSnapshot(userId, role) {
  const user = await User.findById(userId).select("name email phone");
  if (!user) return null;

  if (role === "employee") {
    const employee = await Employee.findOne({ userId });
    return {
      requesterName: employee?.name || user.name || "Employee",
      mobile: user.phone || "",
      email: user.email || "",
      designation: employee?.designation || employee?.role || "Employee",
      district: employee?.district || employee?.workingDistrict || "",
      state: employee?.state || employee?.workingState || "",
    };
  }

  const card = await Card.findOne({ cardHolderUser: userId });
  return {
    requesterName: card?.cardholderName || user.name || "Card Holder",
    mobile: card?.mobileNumber || user.phone || "",
    email: user.email || card?.email || "",
    designation: card?.occupation || "Card Holder",
    district: card?.district || "",
    state: card?.state || "",
  };
}

async function getEligibilityForUser(userId) {
  const pending = await CampRequest.findOne({ userId, status: "Pending" });
  const lastRequest = await CampRequest.findOne({ userId }).sort({ submittedAt: -1 });

  const now = new Date();
  let eligibleFrom = null;
  let canRequest = true;
  let daysRemaining = 0;

  if (lastRequest) {
    eligibleFrom = addCalendarMonths(lastRequest.submittedAt, 3);
    canRequest = now >= eligibleFrom;
    if (!canRequest) {
      daysRemaining = daysBetween(now, eligibleFrom);
    }
  }

  return {
    canRequest: canRequest && !pending,
    eligibleFrom,
    daysRemaining,
    hasPending: !!pending,
    lastRequestAt: lastRequest?.submittedAt || null,
  };
}

router.post(
  "/",
  authenticate,
  authorize("admin", "superadmin", "staff"),
  async (req, res) => {
    try {
      const { name, state, district, blockId, panchayatId, campDate, organizer, address } = req.body;
      if (!name?.trim() || !state?.trim() || !district?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Camp name, state, and district are required",
        });
      }

      let blockName = "";
      let panchayatName = "";

      if (blockId) {
        const block = await Block.findById(blockId);
        if (block) blockName = block.name || "";
      }
      if (panchayatId) {
        const panchayat = await Panchayat.findById(panchayatId);
        if (panchayat) panchayatName = panchayat.name || "";
      }

      const camp = await Camp.create({
        name: name.trim(),
        state: state.trim(),
        district: district.trim(),
        blockId: blockId || undefined,
        panchayatId: panchayatId || undefined,
        blockName,
        panchayatName,
        campDate: campDate || undefined,
        organizer: organizer?.trim() || "",
        address: address?.trim() || "",
        createdBy: req.user.id,
        status: "Active",
      });

      res.status(201).json({ success: true, message: "Camp created", data: camp });
    } catch (error) {
      console.error("Create camp error:", error);
      res.status(500).json({ success: false, message: "Failed to create camp" });
    }
  }
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "superadmin", "staff"),
  async (req, res) => {
    try {
      const { name, state, district, blockId, panchayatId, campDate, organizer, address } = req.body;
      
      const camp = await Camp.findById(req.params.id);
      if (!camp) return res.status(404).json({ success: false, message: "Camp not found" });

      let blockName = camp.blockName;
      let panchayatName = camp.panchayatName;

      if (blockId && blockId !== camp.blockId?.toString()) {
        const block = await Block.findById(blockId);
        if (block) blockName = block.name || "";
      }
      if (panchayatId && panchayatId !== camp.panchayatId?.toString()) {
        const panchayat = await Panchayat.findById(panchayatId);
        if (panchayat) panchayatName = panchayat.name || "";
      }

      if (name) camp.name = name.trim();
      if (state) camp.state = state.trim();
      if (district) camp.district = district.trim();
      if (blockId !== undefined) camp.blockId = blockId || undefined;
      if (panchayatId !== undefined) camp.panchayatId = panchayatId || undefined;
      camp.blockName = blockName;
      camp.panchayatName = panchayatName;
      
      if (campDate !== undefined) camp.campDate = campDate || undefined;
      if (organizer !== undefined) camp.organizer = organizer?.trim() || "";
      if (address !== undefined) camp.address = address?.trim() || "";

      await camp.save();
      res.json({ success: true, message: "Camp updated", data: camp });
    } catch (error) {
      console.error("Update camp error:", error);
      res.status(500).json({ success: false, message: "Failed to update camp" });
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin", "superadmin", "staff"),
  async (req, res) => {
    try {
      const camp = await Camp.findByIdAndDelete(req.params.id);
      if (!camp) return res.status(404).json({ success: false, message: "Camp not found" });
      res.json({ success: true, message: "Camp deleted" });
    } catch (error) {
      console.error("Delete camp error:", error);
      res.status(500).json({ success: false, message: "Failed to delete camp" });
    }
  }
);

router.get(
  "/admin/stats",
  authenticate,
  authorize("admin", "superadmin", "staff"),
  async (req, res) => {
    try {
      const totalCamps = await Camp.countDocuments();
      const activeCamps = await Camp.countDocuments({ status: "Active" });
      const totalRequests = await CampRequest.countDocuments();
      const pendingRequests = await CampRequest.countDocuments({ status: "Pending" });
      
      res.json({
        success: true,
        data: {
          totalCamps,
          activeCamps,
          totalRequests,
          pendingRequests
        }
      });
    } catch (error) {
      console.error("Camp stats error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch stats" });
    }
  }
);

router.get(
  "/",
  authenticate,
  authorize("admin", "superadmin", "staff"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { state: { $regex: search, $options: "i" } },
          { district: { $regex: search, $options: "i" } },
          { blockName: { $regex: search, $options: "i" } },
          { panchayatName: { $regex: search, $options: "i" } }
        ];
      }
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      
      const total = await Camp.countDocuments(filter);
      const camps = await Camp.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
        
      res.json({ 
        success: true, 
        data: {
          camps,
          pagination: {
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
          }
        } 
      });
    } catch (error) {
      console.error("List camps error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch camps" });
    }
  }
);

router.get(
  "/public/active",
  async (req, res) => {
    try {
      const camps = await Camp.find({ status: "Active" }).sort({ createdAt: -1 });
      res.json({ success: true, data: camps });
    } catch (error) {
      console.error("Public active camps error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch active camps" });
    }
  }
);

router.get(
  "/active",
  authenticate,
  authorize("employee", "cardHolder"),
  async (req, res) => {
    try {
      const camps = await Camp.find({ status: "Active" }).sort({ createdAt: -1 });
      res.json({ success: true, data: camps });
    } catch (error) {
      console.error("Active camps error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch active camps" });
    }
  }
);

router.get(
  "/requests/eligibility",
  authenticate,
  authorize("employee", "cardHolder"),
  async (req, res) => {
    try {
      if (req.user.role === "employee") {
        const employee = await Employee.findOne({ userId: req.user.id });
        if (employee?.status === "Resigned") {
          return res.json({
            success: true,
            data: {
              canRequest: false,
              hasPending: false,
              daysRemaining: 0,
              eligibleFrom: null,
              employeeStatus: "Resigned",
              message: "Resigned employees cannot submit camp requests",
            },
          });
        }
      }

      const data = await getEligibilityForUser(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      console.error("Camp eligibility error:", error);
      res.status(500).json({ success: false, message: "Failed to check eligibility" });
    }
  }
);

router.post(
  "/requests",
  authenticate,
  authorize("employee", "cardHolder"),
  async (req, res) => {
    try {
      const userRole = req.user.role;

      if (userRole === "employee") {
        const employee = await Employee.findOne({ userId: req.user.id });
        if (!employee) {
          return res.status(404).json({ success: false, message: "Employee profile not found" });
        }
        if (employee.status === "Resigned") {
          return res.status(403).json({
            success: false,
            message: "Resigned employees cannot submit camp requests",
          });
        }
      }

      const eligibility = await getEligibilityForUser(req.user.id);
      if (!eligibility.canRequest) {
        const msg = eligibility.hasPending
          ? "You already have a pending camp request"
          : `You can submit the next camp request after ${eligibility.eligibleFrom?.toLocaleDateString("en-IN") || "the waiting period"}`;
        return res.status(400).json({ success: false, message: msg, data: eligibility });
      }

      const snapshot = await buildRequesterSnapshot(req.user.id, userRole);
      if (!snapshot) {
        return res.status(404).json({ success: false, message: "User profile not found" });
      }

      const lastRequest = await CampRequest.findOne({ userId: req.user.id }).sort({
        submittedAt: -1,
      });
      const eligibleFromSnapshot = lastRequest
        ? addCalendarMonths(lastRequest.submittedAt, 3)
        : new Date();

      const request = await CampRequest.create({
        userId: req.user.id,
        userRole,
        ...snapshot,
        status: "Pending",
        submittedAt: new Date(),
        eligibleFrom: eligibleFromSnapshot,
      });

      res.status(201).json({
        success: true,
        message: "Camp request submitted successfully",
        data: request,
      });
    } catch (error) {
      console.error("Submit camp request error:", error);
      res.status(500).json({ success: false, message: "Failed to submit camp request" });
    }
  }
);

router.get(
  "/requests/my",
  authenticate,
  authorize("employee", "cardHolder"),
  async (req, res) => {
    try {
      const requests = await CampRequest.find({ userId: req.user.id }).sort({
        submittedAt: -1,
      });
      res.json({ success: true, data: requests });
    } catch (error) {
      console.error("My camp requests error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch your requests" });
    }
  }
);

router.get(
  "/requests/admin/all",
  authenticate,
  authorize("admin", "superadmin", "staff"),
  async (req, res) => {
    try {
      const { status, page = 1, limit = 10, search } = req.query;
      const filter = {};
      if (status && status !== "all") {
        filter.status = status;
      }
      if (search) {
        filter.$or = [
          { requesterName: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { district: { $regex: search, $options: "i" } }
        ];
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const total = await CampRequest.countDocuments(filter);
      const requests = await CampRequest.find(filter)
        .populate("userId", "name email phone role")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const mappedRequests = requests.map((r) => {
        const obj = r.toObject();
        if (!obj.requesterName && obj.userId) {
          obj.requesterName = obj.userId.name;
          obj.mobile = obj.mobile || obj.userId.phone;
          obj.email = obj.email || obj.userId.email;
        }
        return obj;
      });

      res.json({ 
        success: true, 
        data: {
          requests: mappedRequests,
          pagination: {
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
          }
        } 
      });
    } catch (error) {
      console.error("Admin camp requests error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch camp requests" });
    }
  }
);

router.put(
  "/requests/admin/:id",
  authenticate,
  authorize("admin", "superadmin", "staff"),
  async (req, res) => {
    try {
      const { status, adminRemarks } = req.body;
      const request = await CampRequest.findById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: "Request not found" });

      if (status) request.status = status;
      if (adminRemarks !== undefined) request.adminRemarks = adminRemarks;
      request.processedAt = new Date();

      await request.save();
      res.json({ success: true, message: "Request updated", data: request });
    } catch (error) {
      console.error("Update request error:", error);
      res.status(500).json({ success: false, message: "Failed to update request" });
    }
  }
);

export default router;
