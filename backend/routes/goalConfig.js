import express from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import GoalConfig from "../models/GoalConfig.js";
import Attendance from "../models/Attendance.js";
import Application from "../models/Application.js";
import Lead from "../models/Lead.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Card from "../models/Card.js";
import Transaction from "../models/Transaction.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const saveSelfieImage = (userId, base64Data) => {
  if (!base64Data) return null;
  try {
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, 'base64');

    const uploadDir = path.join(__dirname, "../uploads/attendance_selfies");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `selfie_${userId}_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/attendance_selfies/${fileName}`;
  } catch (error) {
    console.error("Error saving selfie image:", error);
    return null;
  }
};

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// --- ADMIN ENDPOINTS ---

/**
 * GET /api/goal-config
 * Get all role configurations (Admin Only)
 */
router.get("/", async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const configs = await GoalConfig.find();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/goal-config/:role
 * Update configuration for a specific role (Admin Only)
 */
router.put("/:role", async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { role } = req.params;
    const updateData = req.body;

    const config = await GoalConfig.findOneAndUpdate(
      { role },
      { ...updateData, updatedBy: req.user.id },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: "Configuration updated", data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- EMPLOYEE ENDPOINTS ---

/**
 * GET /api/goal-config/employee-configs
 * Get goal configs for authorization letters (Employees)
 */
router.get("/employee-configs", async (req, res) => {
  try {
    const configs = await GoalConfig.find({}, 'role individualCommission layeredCommissions baseSalary stateSalaries');
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/goal-config/my-stats
 * Get current employee's goal stats (Individual + Team)
 */
router.get("/my-stats", async (req, res) => {
  try {
    const userId = req.user.id;
    let employee = null;

    if (req.user.role === "staff") {
      const AdministrativeStaff = mongoose.models.AdministrativeStaff || mongoose.model("AdministrativeStaff");
      employee = await AdministrativeStaff.findOne({ userId });
    } else {
      employee = await Employee.findOne({ userId });
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    // Robust Role Detection (Mutually Exclusive with Priority)
    const postName = (employee.jobPostingId?.post?.en || employee.designation || "").toLowerCase();
    const myRole = (employee.role || "").toUpperCase();

    const isRM = myRole === "RM" || postName.includes("regional manager");
    const isZC = !isRM && (myRole === "ZC" || postName.includes("zonal coordinator"));
    const isDM = !isRM && !isZC && (myRole === "DM" || postName.includes("district manager"));
    const isBS = !isRM && !isZC && !isDM && (myRole === "BS" || postName.includes("block supervisor"));
    const isPE = !isRM && !isZC && !isDM && !isBS && (myRole === "PE" || postName.includes("panchayat executive"));

    // Map to normalized role for config lookup
    const normalizedRole = isRM ? "RM" : isZC ? "ZC" : isDM ? "DM" : isBS ? "BS" : "PE";
    const config = await GoalConfig.findOne({ role: normalizedRole });

    // Calculate current month date range
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // 1. Individual Stats (Cards from Card model + Applications)
    const cardModelCount = await Card.countDocuments({
      issuedBy: userId,
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });

    const individualCards = cardModelCount; // Focusing on member cards as per user request

    const individualLeads = await Lead.countDocuments({
      createdBy: userId,
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });

    // 2. Team Stats (High-Performance DSA Approach for 8k+ Employees)
    let teamCards = 0;

    // Helper to check actual designation names from DB
    const isHigherOfficial = isBS || isDM || isZC || isRM;

    if (isHigherOfficial && config?.teamCardTargetEnabled) {
      // 1. Fetch minimal data for ALL employees in ONE query for tree building
      // This is efficient even for 10k+ records
      const allHierarchyData = await Employee.find({}).select("userId reportingTo designation role");

      // 2. Build Adjacency List for the entire organization
      const adjList = {};
      allHierarchyData.forEach(emp => {
        if (emp.reportingTo) {
          const bossId = emp.reportingTo.toString();
          if (!adjList[bossId]) adjList[bossId] = [];
          adjList[bossId].push(emp.userId.toString());
        }
      });

      // 3. Recursive DFS with Cycle Detection to gather all subordinate IDs
      const gatherAllSubordinates = (id, visited = new Set()) => {
        if (visited.has(id)) return []; // Prevent infinite loops
        visited.add(id);

        let subordinates = [];
        const directChildren = adjList[id] || [];
        subordinates.push(...directChildren);

        for (const childId of directChildren) {
          subordinates.push(...gatherAllSubordinates(childId, visited));
        }
        return subordinates;
      };

      const allSubordinateIds = gatherAllSubordinates(userId);

      // 4. Final Aggregation
      teamCards = await Card.countDocuments({
        issuedBy: { $in: allSubordinateIds },
        createdAt: { $gte: startOfMonth, $lt: endOfMonth }
      });
    }

    res.json({
      success: true,
      data: {
        role: normalizedRole,
        config: config || {},
        stats: {
          individual: {
            cards: individualCards,
            leads: individualLeads
          },
          team: {
            cards: teamCards
          }
        },
        isZoneLocked: employee.isZoneLocked
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper to get normalized config for employee
const getEmployeeConfig = async (userId) => {
  const employee = await Employee.findOne({ userId });
  if (!employee) return null;
  const postName = (employee.jobPostingId?.post?.en || employee.designation || "").toLowerCase();
  const myRole = (employee.role || "").toUpperCase();

  const isRM = myRole === "RM" || postName.includes("regional manager");
  const isZC = !isRM && (myRole === "ZC" || postName.includes("zonal coordinator"));
  const isDM = !isRM && !isZC && (myRole === "DM" || postName.includes("district manager"));
  const isBS = !isRM && !isZC && !isDM && (myRole === "BS" || postName.includes("block supervisor"));
  const isPE = !isRM && !isZC && !isDM && !isBS && (myRole === "PE" || postName.includes("panchayat executive"));

  const normalizedRole = isRM ? "RM" : isZC ? "ZC" : isDM ? "DM" : isBS ? "BS" : "PE";
  return await GoalConfig.findOne({ role: normalizedRole });
};

/**
 * GET /api/goal-config/target-history
 * Get past 6 months individual target history
 */
router.get("/target-history", async (req, res) => {
  try {
    const userId = req.user.id;
    let employee = null;

    if (req.user.role === "staff") {
      const AdministrativeStaff = mongoose.models.AdministrativeStaff || mongoose.model("AdministrativeStaff");
      employee = await AdministrativeStaff.findOne({ userId });
    } else {
      employee = await Employee.findOne({ userId });
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    const postName = (employee.jobPostingId?.post?.en || employee.designation || "").toLowerCase();
    const myRole = (employee.role || "").toUpperCase();

    const isRM = myRole === "RM" || postName.includes("regional manager");
    const isZC = !isRM && (myRole === "ZC" || postName.includes("zonal coordinator"));
    const isDM = !isRM && !isZC && (myRole === "DM" || postName.includes("district manager"));
    const isBS = !isRM && !isZC && !isDM && (myRole === "BS" || postName.includes("block supervisor"));
    const isPE = !isRM && !isZC && !isDM && !isBS && (myRole === "PE" || postName.includes("panchayat executive"));

    const normalizedRole = isRM ? "RM" : isZC ? "ZC" : isDM ? "DM" : isBS ? "BS" : "PE";
    const config = await GoalConfig.findOne({ role: normalizedRole });
    const monthlyCardTarget = config?.monthlyCardTarget || 0;

    const history = [];
    const currentDate = new Date();

    // Past 6 months
    for (let i = 1; i <= 6; i++) {
      const startOfTargetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const endOfTargetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);

      const monthName = startOfTargetMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

      const achieved = await Card.countDocuments({
        issuedBy: userId,
        createdAt: { $gte: startOfTargetMonth, $lt: endOfTargetMonth }
      });

      const percentage = monthlyCardTarget > 0 ? Math.min(Math.round((achieved / monthlyCardTarget) * 100), 100) : (achieved > 0 ? 100 : 0);

      history.push({
        month: monthName,
        target: monthlyCardTarget,
        achieved: achieved,
        percentage: percentage
      });
    }

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


/**
 * GET /api/goal-config/rm-stats
 */
router.get("/rm-stats", async (req, res) => {
  try {
    const userId = req.user.id;
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    const postName = (employee.jobPostingId?.post?.en || employee.designation || "").toLowerCase();
    const myRole = (employee.role || "").toUpperCase();
    const isRM = myRole === "RM" || postName.includes("regional manager");

    if (!isRM) {
      return res.status(403).json({ success: false, message: "Only RM can access this." });
    }

    // Fetch Target Configs
    const goalConfigs = await GoalConfig.find({});
    const configMap = {};
    let rmBaseSalary = 35500;
    goalConfigs.forEach(c => {
      configMap[c.role] = c.monthlyCardTarget || 0;
      if (c.role === 'RM') {
        rmBaseSalary = c.baseSalary || 35500;
        
        const candidateState = employee.workingState || employee.jobPostingId?.state || '';
        if (candidateState && c.stateSalaries && c.stateSalaries.length > 0) {
           const cleanState = candidateState.split(" / ")[0].trim();
           const stateObj = c.stateSalaries.find(s => s.state?.toLowerCase() === cleanState.toLowerCase());
           if (stateObj && stateObj.salary) {
              rmBaseSalary = stateObj.salary;
           }
        }
      }
    });

    const targetDM = configMap["DM"] || 50;
    const targetBS = configMap["BS"] || 20;
    const targetPE = configMap["PE"] || 10;

    // Build Adjacency List for DFS
    const allHierarchyData = await Employee.find({}).select("userId reportingTo designation role");
    
    const adjList = {};
    const roleMap = {};

    allHierarchyData.forEach(emp => {
      if (emp.reportingTo) {
        const bossId = emp.reportingTo.toString();
        if (!adjList[bossId]) adjList[bossId] = [];
        adjList[bossId].push(emp.userId.toString());
      }
      
      const empRoleRaw = (emp.role || "").toUpperCase();
      const empDesig = (emp.designation || "").toLowerCase();
      let normRole = "OTHER";
      if (empRoleRaw === "DM" || empDesig.includes("district manager")) normRole = "DM";
      else if (empRoleRaw === "BS" || empDesig.includes("block supervisor")) normRole = "BS";
      else if (empRoleRaw === "PE" || empDesig.includes("panchayat executive")) normRole = "PE";
      
      roleMap[emp.userId.toString()] = normRole;
    });

    const gatherAllSubordinates = (id, visited = new Set()) => {
      if (visited.has(id)) return []; 
      visited.add(id);

      let subordinates = [];
      const directChildren = adjList[id] || [];
      subordinates.push(...directChildren);

      for (const childId of directChildren) {
        subordinates.push(...gatherAllSubordinates(childId, visited));
      }
      return subordinates;
    };

    const allSubordinateIds = gatherAllSubordinates(userId);

    let dmCount = 0;
    let bsCount = 0;
    let peCount = 0;
    
    allSubordinateIds.forEach(subId => {
      if (roleMap[subId] === "DM") dmCount++;
      else if (roleMap[subId] === "BS") bsCount++;
      else if (roleMap[subId] === "PE") peCount++;
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const cardCounts = await Card.aggregate([
      {
        $match: {
          issuedBy: { $in: allSubordinateIds },
          createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        }
      },
      {
        $group: {
          _id: "$issuedBy",
          count: { $sum: 1 }
        }
      }
    ]);

    let dmAchieved = 0;
    let bsAchieved = 0;
    let peAchieved = 0;

    cardCounts.forEach(c => {
      const subId = c._id.toString();
      const count = c.count;
      if (roleMap[subId] === "DM") dmAchieved += count;
      else if (roleMap[subId] === "BS") bsAchieved += count;
      else if (roleMap[subId] === "PE") peAchieved += count;
    });

    const totalTarget = (targetDM * dmCount) + (targetBS * bsCount) + (targetPE * peCount);
    const totalAchieved = dmAchieved + bsAchieved + peAchieved;
    const globalPR = totalTarget > 0 ? Math.min(Math.round((totalAchieved / totalTarget) * 100), 100) : 0;

    // Credit Base Salary if Target >= 75% and not already credited this month
    if (globalPR >= 75) {
      const existingTx = await Transaction.findOne({
         userId: userId,
         type: "CREDIT_COMMISSION",
         remarks: "RM Target Base Salary Bonus",
         createdAt: { $gte: startOfMonth, $lt: endOfMonth }
      });

      if (!existingTx) {
         await Transaction.create({
            userId: userId,
            employeeId: employee._id,
            amount: rmBaseSalary,
            type: "CREDIT_COMMISSION",
            status: "SUCCESS",
            remarks: "RM Target Base Salary Bonus",
            metadata: { globalPR, month: startOfMonth.toISOString() }
         });
         
         employee.salaryWallet = (employee.salaryWallet || 0) + rmBaseSalary;
         await employee.save();
      }
    }

    res.json({
      success: true,
      data: {
        teamBreakdown: {
          dm: { count: dmCount, baseTarget: targetDM, totalTarget: dmCount * targetDM, achieved: dmAchieved },
          bs: { count: bsCount, baseTarget: targetBS, totalTarget: bsCount * targetBS, achieved: bsAchieved },
          pe: { count: peCount, baseTarget: targetPE, totalTarget: peCount * targetPE, achieved: peAchieved },
        },
        globalPR,
        salaryWallet: employee.salaryWallet
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/goal-config/attendance/check-in
 */
router.post("/attendance/check-in", async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];
    const { location, selfie } = req.body;

    const selfiePath = selfie ? saveSelfieImage(userId, selfie) : null;

    const attendance = await Attendance.findOneAndUpdate(
      { employeeId: userId, date: today },
      {
        checkIn: { time: new Date(), location, selfie: selfiePath },
        status: "Checked-In"
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: "Checked in successfully.", data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/goal-config/attendance/check-out
 */
router.post("/attendance/check-out", async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];
    const { location } = req.body;

    const attendance = await Attendance.findOne({ employeeId: userId, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ success: false, message: "Please check-in first" });
    }

    const now = new Date();
    attendance.checkOut = { time: now, location };

    // Calculate working hours
    const diffMs = attendance.checkOut.time - attendance.checkIn.time;
    attendance.workingHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

    attendance.status = "Completed";

    await attendance.save();

    res.json({
      success: true,
      message: "Checked out successfully.",
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/attendance/status", async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    // 1. Safe Lazy Auto-checkout: If there are any open check-ins from past days, auto-checkout them at 23:59:59 of that day
    const openPastRecords = await Attendance.find({
      employeeId: userId,
      date: { $ne: today },
      "checkIn.time": { $exists: true },
      $or: [
        { "checkOut.time": { $exists: false } },
        { checkOut: null }
      ]
    });

    if (openPastRecords && openPastRecords.length > 0) {
      for (const record of openPastRecords) {
        // Parse record's original date
        const parts = record.date.split("-");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
        const day = parseInt(parts[2], 10);

        // Auto check-out time is set to 23:59:59 on that day
        const autoCheckOutTime = new Date(year, month, day, 23, 59, 59);

        const checkOutData = {
          time: autoCheckOutTime
        };
        // Only set location if checkIn has a valid location structure
        if (record.checkIn && record.checkIn.location && (record.checkIn.location.lat || record.checkIn.location.lng || record.checkIn.location.address)) {
          checkOutData.location = {
            lat: record.checkIn.location.lat,
            lng: record.checkIn.location.lng,
            address: record.checkIn.location.address
          };
        }
        record.checkOut = checkOutData;

        // Calculate working hours
        if (record.checkIn?.time) {
          const diffMs = autoCheckOutTime - new Date(record.checkIn.time);
          record.workingHours = Number(Math.max(0, (diffMs / (1000 * 60 * 60))).toFixed(2));
        } else {
          record.workingHours = 0;
        }

        record.status = "Completed";
        await record.save();
      }
    }

    // 2. Fetch and return today's attendance status
    const attendance = await Attendance.findOne({ employeeId: userId, date: today });

    res.json({ success: true, data: attendance || null });
  } catch (error) {
    console.error("Error in lazy auto-checkout status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/goal-config/attendance/my-monthly
 * Fetch current user's attendance for the current month
 */
router.get("/attendance/my-monthly", async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Optionally accept a target month in 'YYYY-MM' format, otherwise default to current month
    const { month } = req.query;
    let targetMonthStr = month;
    
    if (!targetMonthStr) {
      // Use local date string assuming standard India timezone (IST) where applicable,
      // or simply rely on ISO string as other attendance dates do.
      const now = new Date();
      // Add 5.5 hours to align UTC with IST for accurate date boundaries
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      targetMonthStr = istTime.toISOString().split("T")[0].substring(0, 7); // Extract "YYYY-MM"
    }

    const attendanceRecords = await Attendance.find({
      employeeId: userId,
      date: { $regex: new RegExp(`^${targetMonthStr}`) }
    }).sort({ date: 1 });

    res.json({ success: true, data: attendanceRecords });
  } catch (error) {
    console.error("Error fetching my-monthly attendance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/goal-config/admin/target-tracking
 * Fetch target tracking for all employees (Admin Only)
 */
router.get("/admin/target-tracking", async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { role, state, district, block, panchayat, search, zoneStatus, month } = req.query;

    let empMatch = { role: { $in: ["RM", "ZC", "DM", "BS", "PE"] } }; 

    if (zoneStatus === "locked") {
      empMatch.isZoneLocked = true;
    } else if (zoneStatus === "unlocked") {
      empMatch.isZoneLocked = { $ne: true };
    }

    if (role && role !== "all") {
      empMatch.role = role.toUpperCase();
    }
    if (state && state !== "all") {
      empMatch.workingState = { $regex: new RegExp(`^${state}`, "i") };
    }
    if (district && district !== "all") {
      empMatch.workingDistrict = { $regex: new RegExp(`^${district}`, "i") };
    }
    if (block && block !== "all") {
      const Block = mongoose.models.Block || mongoose.model("Block");
      const matchedBlocks = await Block.find({ name: { $regex: new RegExp(`^${block}`, "i") } }).select("_id");
      empMatch.workingBlock = { $in: matchedBlocks.map(b => b._id) };
    }
    if (panchayat && panchayat !== "all") {
      const Panchayat = mongoose.models.Panchayat || mongoose.model("Panchayat");
      const matchedPanchayats = await Panchayat.find({ name: { $regex: new RegExp(`^${panchayat}`, "i") } }).select("_id");
      empMatch.workingPanchayat = { $in: matchedPanchayats.map(p => p._id) };
    }
    
    if (search) {
      empMatch.name = { $regex: new RegExp(search, "i") };
    }

    // Fetch Employees
    const employees = await Employee.find(empMatch)
      .populate("workingBlock", "name")
      .populate("workingPanchayat", "name")
      .select("userId name phone role designation workingState workingDistrict workingBlock workingPanchayat profilePicture isZoneLocked")
      .lean();

    if (!employees.length) {
       return res.json({ success: true, data: [] });
    }

    // Fetch Configs
    const goalConfigs = await GoalConfig.find({});
    const configMap = {};
    goalConfigs.forEach(c => {
       configMap[c.role] = c;
    });

    // Calculate date range based on month filter
    let startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let endOfMonth = new Date(startOfMonth);
    
    if (month === "past") {
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);
      endOfMonth.setMonth(startOfMonth.getMonth() + 1);
    } else {
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    }

    const userIds = employees.map(e => e.userId).filter(Boolean);

    const cardCounts = await Card.aggregate([
      {
        $match: {
          issuedBy: { $in: userIds },
          createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        }
      },
      {
        $group: {
          _id: "$issuedBy",
          count: { $sum: 1 },
          newCards: { $sum: { $cond: [{ $ne: ["$cardType", "Old Card"] }, 1, 0] } },
          oldCards: { $sum: { $cond: [{ $eq: ["$cardType", "Old Card"] }, 1, 0] } }
        }
      }
    ]);

    const achievedMap = {};
    const newCardsMap = {};
    const oldCardsMap = {};
    cardCounts.forEach(c => {
      achievedMap[c._id.toString()] = c.count;
      newCardsMap[c._id.toString()] = c.newCards || 0;
      oldCardsMap[c._id.toString()] = c.oldCards || 0;
    });

    // Format Data
    const formattedData = employees.map(emp => {
      const empRole = emp.role ? emp.role.toUpperCase() : "PE";
      const config = configMap[empRole] || {};
      const target = config.monthlyCardTarget || 0;
      const achieved = achievedMap[emp.userId?.toString()] || 0;
      const newCards = newCardsMap[emp.userId?.toString()] || 0;
      const oldCards = oldCardsMap[emp.userId?.toString()] || 0;

      let percentage = target > 0 ? Math.min(Math.round((achieved / target) * 100), 100) : (achieved > 0 ? 100 : 0);
      
      let colorCode = "red";
      if (percentage >= 75) colorCode = "green";
      else if (percentage >= 40) colorCode = "orange";

      return {
        _id: emp._id,
        userId: emp.userId,
        name: emp.name,
        phone: emp.phone,
        role: empRole,
        designation: emp.designation,
        state: emp.workingState || "N/A",
        district: emp.workingDistrict || "N/A",
        block: emp.workingBlock ? emp.workingBlock.name : "N/A",
        panchayat: emp.workingPanchayat ? emp.workingPanchayat.name : "N/A",
        target,
        achieved,
        newCards,
        oldCards,
        percentage,
        colorCode,
        profilePicture: emp.profilePicture,
        isZoneLocked: emp.isZoneLocked || false
      };
    });

    res.json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/goal-config/admin/attendance
 * Fetch all employee attendance records (Admin/Staff Only)
 */
router.get("/admin/attendance", async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const today = new Date().toISOString().split("T")[0];

    // Auto-checkout any open past records for all employees
    const openPastRecords = await Attendance.find({
      date: { $ne: today },
      "checkIn.time": { $exists: true },
      $or: [
        { "checkOut.time": { $exists: false } },
        { checkOut: null }
      ]
    });

    if (openPastRecords && openPastRecords.length > 0) {
      for (const record of openPastRecords) {
        // Parse record's original date
        const parts = record.date.split("-");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
        const day = parseInt(parts[2], 10);

        const autoCheckOutTime = new Date(year, month, day, 23, 59, 59);

        const checkOutData = {
          time: autoCheckOutTime
        };
        // Only set location if checkIn has a valid location structure
        if (record.checkIn && record.checkIn.location && (record.checkIn.location.lat || record.checkIn.location.lng || record.checkIn.location.address)) {
          checkOutData.location = {
            lat: record.checkIn.location.lat,
            lng: record.checkIn.location.lng,
            address: record.checkIn.location.address
          };
        }
        record.checkOut = checkOutData;

        if (record.checkIn?.time) {
          const diffMs = autoCheckOutTime - new Date(record.checkIn.time);
          record.workingHours = Number(Math.max(0, (diffMs / (1000 * 60 * 60))).toFixed(2));
        } else {
          record.workingHours = 0;
        }

        record.status = "Completed";
        await record.save();
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // === GLOBAL BACKEND FILTERS ===
    const { search, status: statusFilter, designation: designationFilter, dateFrom, dateTo, employeeId, personType } = req.query;

    let attendanceQuery = {};

    // Date range filter (operates on the date string field YYYY-MM-DD)
    if (dateFrom || dateTo) {
      attendanceQuery.date = {};
      if (dateFrom) attendanceQuery.date.$gte = dateFrom;
      if (dateTo) attendanceQuery.date.$lte = dateTo;
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      const statusMap = {
        "checked-in": "Checked-In",
        "completed": "Completed",
        "late": "Late",
        "half-day": "Half-Day",
        "absent": "Absent"
      };
      const mappedStatus = statusMap[statusFilter.toLowerCase()];
      if (mappedStatus) attendanceQuery.status = mappedStatus;
    }

    // Single employee filter — for View Modal (fetch all records of one employee)
    if (employeeId) {
      attendanceQuery.employeeId = employeeId;
    }

    // Designation, Role and Location filters — cross-collection lookup
    const { state, district, block, panchayat, role, export: isExport } = req.query;

    if ((designationFilter && designationFilter !== "all") || (role && role !== "all") || (state && state !== "all") || (district && district !== "all") || (block && block !== "all") || (panchayat && panchayat !== "all")) {
      let empMatch = {};

      if (designationFilter && designationFilter !== "all") {
        empMatch.designation = { $regex: new RegExp(`^${designationFilter}$`, "i") };
      }
      if (role && role !== "all") {
        empMatch.role = role.toUpperCase();
      }
      if (state && state !== "all") {
        empMatch.workingState = { $regex: new RegExp(`^${state}$`, "i") };
      }
      if (district && district !== "all") {
        empMatch.workingDistrict = { $regex: new RegExp(`^${district}$`, "i") };
      }
      if (block && block !== "all") {
        const Block = mongoose.models.Block || mongoose.model("Block");
        const matchedBlocks = await Block.find({ name: { $regex: new RegExp(`^${block}$`, "i") } }).select("_id");
        empMatch.workingBlock = { $in: matchedBlocks.map(b => b._id) };
      }
      if (panchayat && panchayat !== "all") {
        const Panchayat = mongoose.models.Panchayat || mongoose.model("Panchayat");
        const matchedPanchayats = await Panchayat.find({ name: { $regex: new RegExp(`^${panchayat}$`, "i") } }).select("_id");
        empMatch.workingPanchayat = { $in: matchedPanchayats.map(p => p._id) };
      }

      const matchingEmps = await Employee.find(empMatch).select("userId");
      const matchingIds = matchingEmps.map(e => e.userId).filter(Boolean);

      if (attendanceQuery.employeeId) {
        // intersect if already set (e.g. view modal)
        // ensure existing query works with $in
        if (typeof attendanceQuery.employeeId === 'string' || attendanceQuery.employeeId instanceof mongoose.Types.ObjectId) {
          const isMatch = matchingIds.some(id => id.toString() === attendanceQuery.employeeId.toString());
          attendanceQuery.employeeId = isMatch ? attendanceQuery.employeeId : { $in: [] }; // empty array to return 0 results
        }
      } else {
        attendanceQuery.employeeId = { $in: matchingIds };
      }
    }

    // Search by employee name — cross-collection lookup
    if (search) {
      const searchEmps = await Employee.find({
        name: { $regex: new RegExp(search, "i") }
      }).select("userId");

      const AdministrativeStaff = mongoose.models.AdministrativeStaff || mongoose.model("AdministrativeStaff");
      const searchStaff = await AdministrativeStaff.find({
        name: { $regex: new RegExp(search, "i") }
      }).select("userId");

      const searchIds = [...searchEmps, ...searchStaff].map(e => e.userId).filter(Boolean);

      if (attendanceQuery.employeeId && attendanceQuery.employeeId.$in) {
        // Intersect with existing filter
        const existing = attendanceQuery.employeeId.$in.map(id => id.toString());
        const filtered = searchIds.filter(sid => existing.includes(sid?.toString()));
        attendanceQuery.employeeId = { $in: filtered };
      } else if (!attendanceQuery.employeeId) {
        attendanceQuery.employeeId = { $in: searchIds };
      }
    }

    // personType filter
    if (personType && (personType === "staff" || personType === "employee")) {
      let allowedIds = [];
      if (personType === "staff") {
        const AdministrativeStaff = mongoose.models.AdministrativeStaff || mongoose.model("AdministrativeStaff");
        const staffList = await AdministrativeStaff.find({}).select("userId");
        allowedIds = staffList.map(s => s.userId).filter(Boolean);
      } else if (personType === "employee") {
        const empList = await Employee.find({}).select("userId");
        allowedIds = empList.map(e => e.userId).filter(Boolean);
      }
      
      if (attendanceQuery.employeeId) {
        if (attendanceQuery.employeeId.$in) {
          const existing = attendanceQuery.employeeId.$in.map(id => id?.toString());
          const filtered = allowedIds.filter(id => existing.includes(id?.toString()));
          attendanceQuery.employeeId = { $in: filtered };
        } else {
          // direct ID
          const directIdStr = attendanceQuery.employeeId.toString();
          const isMatch = allowedIds.some(id => id?.toString() === directIdStr);
          attendanceQuery.employeeId = isMatch ? attendanceQuery.employeeId : { $in: [] };
        }
      } else {
        attendanceQuery.employeeId = { $in: allowedIds };
      }
    }

    // === END GLOBAL FILTERS ===

    const total = await Attendance.countDocuments(attendanceQuery);
    
    // If export is requested, ignore skip/limit and fetch all matching records
    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate("employeeId", "name email role")
      .sort({ date: -1, createdAt: -1 })
      .skip(isExport === 'true' ? 0 : skip)
      .limit(isExport === 'true' ? 0 : limit);

    // Make sure to select "name" as well!
    const employees = await Employee.find().select("userId designation role name");

    const AdministrativeStaff = mongoose.models.AdministrativeStaff || mongoose.model("AdministrativeStaff");
    const staff = await AdministrativeStaff.find().select("userId designation role name");

    const empMap = {};
    employees.forEach(emp => {
      if (emp.userId) {
        empMap[emp.userId.toString()] = emp;
      }
    });
    staff.forEach(st => {
      if (st.userId) {
        empMap[st.userId.toString()] = st;
      }
    });

    const roleMap = {
      RM: "Regional Manager (RM)",
      ZC: "Zonal Coordinator (ZC)",
      DM: "District Manager",
      BS: "Block Supervisor",
      PE: "Panchayat Executive"
    };

    const enrichedRecords = attendanceRecords.map(record => {
      const recordObj = record.toObject();
      const emp = record.employeeId ? empMap[record.employeeId._id.toString()] : null;
      
      let displayDesignation = emp?.designation || record.employeeId?.role || "Employee";
      if (emp?.role) {
        displayDesignation = roleMap[emp.role.toUpperCase()] || displayDesignation;
      } else if (record.employeeId?.role) {
        displayDesignation = roleMap[record.employeeId.role.toUpperCase()] || displayDesignation;
      }

      return {
        ...recordObj,
        designation: displayDesignation,
        employeeName: emp?.name || record.employeeId?.name || "Unknown"
      };
    });

    if (isExport === 'true') {
      const exportData = enrichedRecords.map(item => ({
        "Date": item.date,
        "Employee Name": item.employeeName,
        "Designation": item.designation,
        "Status": item.status,
        "Check-in Time": item.checkIn?.time ? new Date(item.checkIn.time).toLocaleTimeString() : "N/A",
        "Check-out Time": item.checkOut?.time ? new Date(item.checkOut.time).toLocaleTimeString() : "N/A",
        "Working Hours": item.workingHours || 0
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Disposition", 'attachment; filename="attendance_export.xlsx"');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(buffer);
    }

    res.json({
      success: true,
      data: enrichedRecords,
      pagination: {
        currentPage: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/goal-config/admin/attendance/:id
 * Delete specific attendance record (Admin/Staff Only)
 */
router.delete("/admin/attendance/:id", async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { id } = req.params;
    const deleted = await Attendance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.json({ success: true, message: "Attendance record deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/goal-config/target-tracking/team
 * Get RM's details and team target tracking
 */
router.get("/target-tracking/team", async (req, res) => {
  try {
    const userId = req.user.id;
    const employee = await Employee.findOne({ userId })
      .populate("workingDistrict workingBlock workingPanchayat");
      
    const isRM = employee && (employee.role === "RM" || (employee.jobPostingId?.post?.en || employee.designation || "").toLowerCase().includes("regional manager"));
    const isZC = employee && (employee.role === "ZC" || (employee.jobPostingId?.post?.en || employee.designation || "").toLowerCase().includes("zonal coordinator"));

    if (!employee || (!isRM && !isZC)) {
      return res.status(403).json({ success: false, message: "Access denied. Only RM or ZC can access this." });
    }

    const { designation, district, block, panchayat, timeFilter, startDate, endDate, cardType } = req.query;

    let startRange = null;
    let endRange = null;

    if (timeFilter === "all_time") {
      // Keep null to fetch all cards
    } else if (timeFilter === "custom_date" && startDate && endDate) {
      startRange = new Date(startDate);
      startRange.setHours(0, 0, 0, 0);

      endRange = new Date(endDate);
      endRange.setHours(23, 59, 59, 999);
    } else if (timeFilter === "past_month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      endRange = new Date(startOfMonth);
      startRange = new Date(startOfMonth);
      startRange.setMonth(startRange.getMonth() - 1);
    } else if (req.query.month === "past") {
      startRange = new Date();
      startRange.setMonth(startRange.getMonth() - 1);
      startRange.setDate(1);
      startRange.setHours(0, 0, 0, 0);

      endRange = new Date(startRange);
      endRange.setMonth(endRange.getMonth() + 1);
    } else {
      // default: current_month
      startRange = new Date();
      startRange.setDate(1);
      startRange.setHours(0, 0, 0, 0);

      endRange = new Date(startRange);
      endRange.setMonth(endRange.getMonth() + 1);
    }

    // 1. Determine geographic scope based on user's role
    let scopeFilter = {};
    const myRole = employee.role || "";
    
    if (myRole === 'PM') {
      scopeFilter = { _id: { $ne: employee._id } }; // See everyone
    } else if (myRole === 'RM') {
      const myStateRaw = employee.workingState || "";
      const myStatePrimary = myStateRaw.split('/')[0].trim();
      if (myStatePrimary) {
        scopeFilter = { 
          workingState: { $regex: new RegExp(`^${myStatePrimary}`, 'i') }
        };
      } else {
        scopeFilter = { _id: null }; // No state assigned, no team
      }
    } else if (myRole === 'ZC' || myRole === 'DM') {
      const myDistricts = (employee.workingDistrict || "").split(',').map(d => d.trim()).filter(Boolean);
      if (myDistricts.length > 0) {
        scopeFilter = {
           $or: myDistricts.map(d => {
             const baseName = d.split('/')[0].trim();
             // Escape special characters just in case
             const safeName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             return { workingDistrict: { $regex: new RegExp(`^${safeName}`, 'i') } };
           })
        };
        const myStateRaw = employee.workingState || "";
        const myStatePrimary = myStateRaw.split('/')[0].trim();
        if (myStatePrimary) {
          scopeFilter.workingState = { $regex: new RegExp(`^${myStatePrimary}`, 'i') };
        }
      } else {
        scopeFilter = { _id: null };
      }
    } else if (myRole === 'BS') {
       if (employee.workingBlock) {
         scopeFilter = { workingBlock: employee.workingBlock };
       } else {
         scopeFilter = { _id: null };
       }
    } else {
       scopeFilter = { _id: null }; // PE has no team
    }

    // Re-added isZoneLocked requirement per user request
    scopeFilter.isZoneLocked = true;

    const allHierarchyData = await Employee.find(scopeFilter)
      .select("userId reportingTo designation role name workingState workingDistrict workingBlock workingPanchayat phone email isZoneLocked");

    let filteredSubordinates = allHierarchyData.filter(emp => emp.userId && emp.userId.toString() !== userId.toString());

    if (district && district !== "all") {
      filteredSubordinates = filteredSubordinates.filter(emp => {
        const dist = emp.workingDistrict;
        if (!dist) return false;
        if (typeof dist === 'string') return dist.toLowerCase().includes(district.toLowerCase());
        return dist.name?.toLowerCase().includes(district.toLowerCase()) || dist._id?.toString() === district;
      });
    }
    
    if (block && block !== "all") {
      filteredSubordinates = filteredSubordinates.filter(emp => {
        const blk = emp.workingBlock;
        if (!blk) return false;
        if (typeof blk === 'string') return blk.toLowerCase().includes(block.toLowerCase());
        return blk.name?.toLowerCase().includes(block.toLowerCase()) || blk._id?.toString() === block;
      });
    }
    
    if (panchayat && panchayat !== "all") {
      filteredSubordinates = filteredSubordinates.filter(emp => {
        const pan = emp.workingPanchayat;
        if (!pan) return false;
        if (typeof pan === 'string') return pan.toLowerCase().includes(panchayat.toLowerCase());
        return pan.name?.toLowerCase().includes(panchayat.toLowerCase()) || pan._id?.toString() === panchayat;
      });
    }

    // Fetch Card counts for filtered subordinates BEFORE designation filter
    // Include the logged-in user's ID to fetch their Self Card count
    const mongoose = require('mongoose');
    const allFilteredIds = [...filteredSubordinates.map(emp => emp.userId), new mongoose.Types.ObjectId(userId)];
    
    const matchStage = { issuedBy: { $in: allFilteredIds } };
    if (startRange && endRange) {
      matchStage.createdAt = { $gte: startRange, $lt: endRange };
    }
    if (cardType && cardType !== "all") {
      if (cardType === "New Card") {
        matchStage.cardType = { $ne: "Old Card" };
      } else {
        matchStage.cardType = cardType;
      }
    }

    const cardCounts = await Card.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$issuedBy",
          count: { $sum: 1 },
          newCards: { $sum: { $cond: [{ $ne: ["$cardType", "Old Card"] }, 1, 0] } },
          oldCards: { $sum: { $cond: [{ $eq: ["$cardType", "Old Card"] }, 1, 0] } }
        }
      }
    ]);

    const countMap = {};
    const newCardsMap = {};
    const oldCardsMap = {};
    cardCounts.forEach(c => {
      countMap[c._id.toString()] = c.count;
      newCardsMap[c._id.toString()] = c.newCards || 0;
      oldCardsMap[c._id.toString()] = c.oldCards || 0;
    });

    let zcCards = 0, dmCards = 0, bsCards = 0, peCards = 0;
    filteredSubordinates.forEach(emp => {
      const cards = countMap[emp.userId.toString()] || 0;
      const roleStr = (emp.role || "").toUpperCase();
      const desigStr = (emp.designation || "").toUpperCase();

      if (roleStr === "ZC" || desigStr === "ZC" || desigStr.includes("ZONAL")) zcCards += cards;
      else if (roleStr === "DM" || desigStr === "DM" || desigStr.includes("DISTRICT")) dmCards += cards;
      else if (roleStr === "BS" || desigStr === "BS" || desigStr.includes("BLOCK")) bsCards += cards;
      else if (roleStr === "PE" || desigStr === "PE" || desigStr.includes("PANCHAYAT")) peCards += cards;
    });

    const roleCounts = {
      ZC: zcCards,
      DM: dmCards,
      BS: bsCards,
      PE: peCards,
      Self: countMap[userId.toString()] || 0
    };

    if (designation && designation !== "all") {
      filteredSubordinates = filteredSubordinates.filter(emp => {
        const d = (emp.designation || "").toUpperCase();
        const r = (emp.role || "").toUpperCase();
        const search = designation.toUpperCase();
        
        let canonicalRole = "";
        if (r === "ZC" || d === "ZC" || d.includes("ZONAL")) canonicalRole = "ZC";
        else if (r === "DM" || d === "DM" || d.includes("DISTRICT")) canonicalRole = "DM";
        else if (r === "BS" || d === "BS" || d.includes("BLOCK")) canonicalRole = "BS";
        else if (r === "PE" || d === "PE" || d.includes("PANCHAYAT")) canonicalRole = "PE";
        
        if (search === "ZC") return canonicalRole === "ZC";
        if (search === "DM") return canonicalRole === "DM";
        if (search === "BS") return canonicalRole === "BS";
        if (search === "PE") return canonicalRole === "PE";
        
        return r === search || d.includes(search);
      });
    }

    // Fetch Target Configs
    const goalConfigs = await GoalConfig.find({});
    const configMap = {};
    goalConfigs.forEach(c => configMap[c.role] = c.monthlyCardTarget || 0);

    // Default targets if config is missing
    const getTargetForRole = (role, designation) => {
      const r = (role || "").toUpperCase();
      const d = (designation || "").toLowerCase();
      if (r === "PE" || d.includes("panchayat")) return configMap["PE"] || 10;
      if (r === "BS" || d.includes("block")) return configMap["BS"] || 20;
      if (r === "DM" || d.includes("district")) return configMap["DM"] || 50;
      if (r === "ZC" || d.includes("zonal")) return configMap["ZC"] || 100;
      return 0;
    };

    // Format data
    const teamData = filteredSubordinates.map(emp => {
      const achieved = countMap[emp.userId.toString()] || 0;
      const newCards = newCardsMap[emp.userId.toString()] || 0;
      const oldCards = oldCardsMap[emp.userId.toString()] || 0;
      const target = getTargetForRole(emp.role, emp.designation);
      const progress = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : (achieved > 0 ? 100 : 0);
      
      let statusColor = "red";
      if (progress >= 80) statusColor = "green";
      else if (progress >= 50) statusColor = "orange";

      return {
        id: emp.userId,
        name: emp.name,
        designation: emp.designation || emp.role,
        district: emp.workingDistrict || "N/A",
        block: emp.workingBlock || "N/A",
        panchayat: emp.workingPanchayat || "N/A",
        phone: emp.phone || "",
        email: emp.email || "",
        target,
        achieved,
        newCards,
        oldCards,
        progress,
        statusColor
      };
    });

    res.json({
      success: true,
      data: {
        rmDetails: {
          name: employee.name,
          designation: employee.designation || (isZC ? "Zonal Coordinator" : "Regional Manager"),
          zone: employee.workingDistrict || employee.workingState || "N/A",
        },
        team: teamData,
        roleCounts
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
