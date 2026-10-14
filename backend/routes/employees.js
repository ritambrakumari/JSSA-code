import express from "express";
const router = express.Router();
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import JobRole from "../models/JobRole.js";
import Application from "../models/Application.js";
import JobPosting from "../models/JobPosting.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { isValidEmail, isValidPhone, normalizePhone } from "../utils/validation.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Block from "../models/Block.js";


// @desc    Admin Edit Employee Details
// @route   PUT /api/employees/:id/edit
// @access  Private (Admin, Superadmin, Staff)
router.put("/:id/edit", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const { 
      name, email, mobile, bankName, accountNumber, ifscCode, accountHolderName,
      fatherName, motherName, dob, panNumber, aadharNumber, maritalStatus, 
      handicapDisability
    } = req.body;
    
    // Find Employee
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Find associated User
    const user = await User.findById(employee.userId);
    if (!user) {
      return res.status(404).json({ error: "Associated user account not found" });
    }

    // Validate uniqueness first
    let normalizedPhone = mobile ? normalizePhone(mobile) : null;
    let normalizedEmail = email ? email.toLowerCase() : null;

    if (normalizedEmail) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ error: "Email is already registered by someone else." });
      }
    }

    if (normalizedPhone) {
      const existingUser = await User.findOne({ phone: normalizedPhone });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ error: "Mobile number is already registered by someone else." });
      }
    }

    // Update User (Auth Sync)
    if (normalizedEmail) user.email = normalizedEmail;
    if (normalizedPhone) user.phone = normalizedPhone;
    if (name) user.name = name;
    await user.save();

    // Update Employee
    if (name !== undefined) employee.name = name;
    if (bankName !== undefined) employee.bankName = bankName;
    if (accountNumber !== undefined) employee.accountNumber = accountNumber;
    if (ifscCode !== undefined) employee.ifscCode = ifscCode;
    if (accountHolderName !== undefined) employee.accountHolderName = accountHolderName;
    
    if (fatherName !== undefined) employee.fatherName = fatherName;
    if (motherName !== undefined) employee.motherName = motherName;
    if (dob !== undefined && dob !== "") employee.dob = new Date(dob);
    if (panNumber !== undefined) employee.panNumber = panNumber;
    if (aadharNumber !== undefined) employee.aadharNumber = aadharNumber;
    if (maritalStatus !== undefined) employee.maritalStatus = maritalStatus;
    if (handicapDisability !== undefined) employee.handicapDisability = handicapDisability;

    await employee.save();

    res.json({ success: true, message: "Employee profile updated successfully.", employee });
  } catch (error) {
    console.error("Admin Edit Employee error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Self-healing trigger endpoint
// @route   GET /api/employees/trigger-heal
// @access  Public (for development/admin troubleshooting)
router.get("/trigger-heal", async (req, res) => {
  try {
    console.log("🛠️ PUBLIC TRIGGER: RUNNING DB RECONCILIATION & SELF-HEALING HOOK...");
    const paidApps = await Application.find({ mouStatus: "paid" }).populate("jobPostingId");

    let healedList = [];
    for (const app of paidApps) {
      const employee = await Employee.findOne({ userId: app.createdBy });
      if (employee) {
        const postCodeMap = {
          "district manager": "DM",
          "block supervisor": "BS",
          "panchayat executive": "PE",
          "block supervisor cum panchayat executive": "BS"
        };

        const postName = app.jobPostingId?.post?.en || app.post || "District Manager";
        const expectedRole = postCodeMap[postName.toLowerCase().trim()] || "DM";

        const isManuallyUpgraded = ["PM", "RM", "ZC"].includes(employee.role);

        const isMismatch =
          !isManuallyUpgraded && (
            employee.designation !== postName ||
            employee.role !== expectedRole ||
            (employee.jobPostingId && app.jobPostingId && employee.jobPostingId.toString() !== app.jobPostingId._id.toString())
          );

        if (isMismatch) {
          const oldPost = employee.designation;
          const oldRole = employee.role;

          employee.designation = postName;
          employee.role = expectedRole;
          employee.jobPostingId = app.jobPostingId._id;

          await employee.save();
          healedList.push({
            name: employee.name,
            userId: employee.userId,
            oldPost,
            newPost: postName,
            oldRole,
            newRole: expectedRole
          });
        }
      }
    }

    res.json({
      success: true,
      message: `Database self-healing reconciliation complete. Aligned and fixed ${healedList.length} employee records.`,
      healedEmployees: healedList
    });
  } catch (err) {
    console.error("Trigger-heal error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @desc    Get current employee profile
// @route   GET /api/employees/me
// @access  Private
router.get("/me", authenticate, async (req, res) => {
  try {
    // 1. Auto-heal/reconcile this specific employee with their paid MOU application on-demand
    const paidMouApp = await Application.findOne({
      createdBy: req.user.id,
      mouStatus: "paid"
    }).populate("jobPostingId");

    let employee = await Employee.findOne({ userId: req.user.id })
      .populate("jobPostingId")
      .populate("workingBlock")
      .populate("workingBlocks")
      .populate("workingPanchayat")
      .populate("workingPanchayats")
      .populate("userId", "email phone")
      .populate({
        path: "reportingTo",
        select: "name email phone",
        strictPopulate: false,
        options: { strictPopulate: false },
        populate: {
          path: "employeeId",
          select: "name designation role",
          strictPopulate: false,
          options: { strictPopulate: false }
        }
      });

    if (paidMouApp && employee) {
      const postCodeMap = {
        "district manager": "DM",
        "block supervisor": "BS",
        "panchayat executive": "PE",
        "block supervisor cum panchayat executive": "BS"
      };

      const postName = paidMouApp.jobPostingId?.post?.en || paidMouApp.post || "District Manager";
      const expectedRole = postCodeMap[postName.toLowerCase().trim()] || "DM";

      const isManuallyUpgraded = ["RM", "ZC"].includes(employee.role);

      const isMismatch =
        !isManuallyUpgraded && (
          employee.designation !== postName ||
          employee.role !== expectedRole ||
          (employee.jobPostingId && paidMouApp.jobPostingId && employee.jobPostingId._id.toString() !== paidMouApp.jobPostingId._id.toString())
        );

      if (isMismatch) {
        console.log(`🔧 [Auto-Heal /me] Reconciling mismatch for Employee: ${employee.name}`);
        console.log(`   - Old Post: "${employee.designation}" -> New: "${postName}"`);
        console.log(`   - Old Role: "${employee.role}" -> New: "${expectedRole}"`);

        employee.designation = postName;
        employee.role = expectedRole;
        employee.jobPostingId = paidMouApp.jobPostingId._id;

        await employee.save();

        // Re-fetch updated populated employee
        employee = await Employee.findOne({ userId: req.user.id })
          .populate("jobPostingId")
          .populate("workingBlock")
          .populate("workingBlocks")
          .populate("workingPanchayat")
          .populate("workingPanchayats")
          .populate("userId", "email phone")
          .populate({
            path: "reportingTo",
            select: "name email phone",
            strictPopulate: false,
            options: { strictPopulate: false },
            populate: {
              path: "employeeId",
              select: "name designation role",
              strictPopulate: false,
              options: { strictPopulate: false }
            }
          });
      }
    }

    if (!employee) {
      // If no employee record exists yet, return a skeleton for the UI
      return res.json({
        success: true,
        data: {
          name: "New Employee",
          role: req.user.role,
          isOnboarding: true,
          email: req.user.email,
          mobile: req.user.phone
        }
      });
    }

    const data = employee.toObject();
    if (employee.userId) {
      data.email = employee.userId.email;
      data.mobile = employee.userId.phone;
    }

    if (paidMouApp) {
      data.application = paidMouApp;
      data.mouPaidAt = paidMouApp.mouPaidAt || null;
      if (!data.createdAt) {
        data.createdAt = paidMouApp.createdAt;
      }
    }

    // Force consistent designations for promoted roles
    if (data.role === 'PM') data.designation = 'Project Manager ( PM )';
    else if (data.role === 'RM') data.designation = 'Regional Manager ( RM )';
    else if (data.role === 'ZC') data.designation = 'Zonal Coordinator';

    // Fix for duplicate districts in UI, handling Hindi translations appended with '/'
    if (data.workingDistrict) {
      const parts = data.workingDistrict.split(',').map(d => d.trim()).filter(Boolean);
      const uniqueDistrictsMap = new Map();
      parts.forEach(part => {
        const engPart = part.split('/')[0].trim().toLowerCase();
        if (!uniqueDistrictsMap.has(engPart)) {
          uniqueDistrictsMap.set(engPart, part);
        }
      });
      data.workingDistrict = Array.from(uniqueDistrictsMap.values()).join(', ');
    }

    // Dynamically fetch Blocks for ZC and RM to show in their Working Zone
    if (["ZC", "RM"].includes(employee.role)) {
      const Block = mongoose.models.Block || mongoose.model("Block");
      let blockQuery = {};
      if (employee.role === "RM" && employee.workingState) {
        blockQuery.state = { $regex: new RegExp(`^${employee.workingState}$`, "i") };
      } else if (employee.role === "ZC" && data.workingDistrict) {
        const districtList = data.workingDistrict.split(',').map(d => d.split('/')[0].trim());
        blockQuery.district = { $in: districtList.map(d => new RegExp(`^${d}$`, "i")) };
      }

      if (Object.keys(blockQuery).length > 0) {
        data.workingBlocks = await Block.find(blockQuery).select("name district").lean();
      }
    }

    // Dynamically fetch all seniors covering this employee's active zone
    let allReportingOfficers = [];
    if (employee.isZoneLocked) {
      if (employee.role === "PE" && employee.workingBlock) {
        const blockId = employee.workingBlock._id || employee.workingBlock;
        const panchayatId = employee.workingPanchayat?._id || employee.workingPanchayat;

        // Find matching Block Supervisors
        const matchingBSs = await Employee.find({
          role: "BS",
          workingBlock: blockId,
          isZoneLocked: true
        }).populate("userId", "name email phone");

        const filteredBSs = matchingBSs.filter(bs => {
          if (bs.isAllPanchayatsAssigned) return true;
          if (bs.workingPanchayats && bs.workingPanchayats.some(p => p.toString() === panchayatId?.toString())) return true;
          return false;
        });

        if (filteredBSs.length > 0) {
          allReportingOfficers = filteredBSs.map(bs => ({
            name: bs.name,
            role: bs.role,
            designation: bs.designation,
            email: bs.userId?.email,
            phone: bs.userId?.phone || bs.phone
          }));
        } else {
          // Fallback to DMs in district
          const districtName = employee.workingDistrict;
          const matchingDMs = await Employee.find({
            role: "DM",
            workingDistrict: { $regex: new RegExp(`^${districtName}$`, "i") },
            isZoneLocked: true
          }).populate("userId", "name email phone");

          const filteredDMs = matchingDMs.filter(dm => {
            if (dm.isAllBlocksAssigned) return true;
            if (dm.workingBlocks && dm.workingBlocks.some(b => b.toString() === blockId.toString())) return true;
            return false;
          });

          allReportingOfficers = filteredDMs.map(dm => ({
            name: dm.name,
            role: dm.role,
            designation: dm.designation,
            email: dm.userId?.email,
            phone: dm.userId?.phone || dm.phone
          }));
        }
      } else if (employee.role === "BS" && employee.workingBlock) {
        const blockId = employee.workingBlock._id || employee.workingBlock;
        const districtName = employee.workingDistrict;

        const matchingDMs = await Employee.find({
          role: "DM",
          workingDistrict: { $regex: new RegExp(`^${districtName}$`, "i") },
          isZoneLocked: true
        }).populate("userId", "name email phone");

        const filteredDMs = matchingDMs.filter(dm => {
          if (dm.isAllBlocksAssigned) return true;
          if (dm.workingBlocks && dm.workingBlocks.some(b => b.toString() === blockId.toString())) return true;
          return false;
        });

        allReportingOfficers = filteredDMs.map(dm => ({
          name: dm.name,
          role: dm.role,
          designation: dm.designation,
          email: dm.userId?.email,
          phone: dm.userId?.phone || dm.phone
        }));
      } else if (employee.role === "DM" && employee.workingDistrict) {
        const districtName = employee.workingDistrict;
        const matchingZCs = await Employee.find({
          role: "ZC",
          workingDistrict: { $regex: new RegExp(`^${districtName}$`, "i") },
          isZoneLocked: true
        }).populate("userId", "name email phone");

        allReportingOfficers = matchingZCs.map(zc => ({
          name: zc.name,
          role: zc.role,
          designation: zc.designation,
          email: zc.userId?.email,
          phone: zc.userId?.phone || zc.phone
        }));
      } else if (employee.role === "ZC" && employee.workingState) {
        const stateName = employee.workingState;
        const matchingRMs = await Employee.find({
          role: "RM",
          workingState: { $regex: new RegExp(`^${stateName}$`, "i") },
          isZoneLocked: true
        }).populate("userId", "name email phone");

        if (matchingRMs.length > 0) {
          allReportingOfficers = matchingRMs.map(rm => ({
            name: rm.name,
            role: rm.role,
            designation: rm.designation,
            email: rm.userId?.email,
            phone: rm.userId?.phone || rm.phone
          }));
        } else {
          // Fallback to PM if no RM in state
          const matchingPMs = await Employee.find({ role: "PM" }).populate("userId", "name email phone");
          allReportingOfficers = matchingPMs.map(pm => ({
            name: pm.name,
            role: pm.role,
            designation: pm.designation,
            email: pm.userId?.email,
            phone: pm.userId?.phone || pm.phone
          }));
        }
      } else if (employee.role === "RM") {
        const matchingPMs = await Employee.find({ role: "PM" }).populate("userId", "name email phone");
        allReportingOfficers = matchingPMs.map(pm => ({
          name: pm.name,
          role: pm.role,
          designation: pm.designation,
          email: pm.userId?.email,
          phone: pm.userId?.phone || pm.phone
        }));
      }
    }
    data.allSeniors = allReportingOfficers;

    res.json({ success: true, data });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// @desc    Get officers for a specific location
// @route   GET /api/employees/location-officers
// @access  Private
router.get("/location-officers", authenticate, async (req, res) => {
  try {
    const { state, district } = req.query;
    if (!state || !district) {
      return res.status(400).json({ error: "State and district are required" });
    }

    const officers = {
      RM: null,
      ZC: null,
      DM: null
    };

    // Use regex because a ZC or RM might have multiple districts/states in a comma-separated string
    const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const stateRegex = new RegExp(escapeRegex(state), 'i');
    const districtRegex = new RegExp(escapeRegex(district), 'i');

    const rm = await Employee.findOne({ role: "RM", workingState: { $regex: stateRegex }, status: { $in: ["Active", "Resigned"] } }).populate("userId", "email phone").lean();
    const zc = await Employee.findOne({ role: "ZC", workingState: { $regex: stateRegex }, workingDistrict: { $regex: districtRegex }, status: { $in: ["Active", "Resigned"] } }).populate("userId", "email phone").lean();
    const dm = await Employee.findOne({ role: "DM", workingState: { $regex: stateRegex }, workingDistrict: { $regex: districtRegex }, status: { $in: ["Active", "Resigned"] } }).populate("userId", "email phone").lean();

    officers.RM = rm;
    officers.ZC = zc;
    officers.DM = dm;

    res.json({ success: true, data: officers });
  } catch (error) {
    console.error("Get Location Officers Error:", error);
    res.status(500).json({ error: "Failed to fetch location officers" });
  }
});

// @desc    Get employee hierarchy
// @route   GET /api/employees/hierarchy
// @access  Private
router.get("/hierarchy", authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id })
      .populate("jobPostingId")
      .populate("workingBlock")
      .populate("workingBlocks")
      .populate("workingPanchayat")
      .populate("workingPanchayats")
      .populate("userId", "email phone");

    if (!employee && req.user.role === "staff") {
      const AdministrativeStaff = mongoose.models.AdministrativeStaff || mongoose.model("AdministrativeStaff");
      const staff = await AdministrativeStaff.findOne({ userId: req.user.id }).populate("jobRoleId");
      if (staff) {
        const jobTitle = staff.jobRoleId?.jobTitle || "";
        if (jobTitle.toLowerCase().includes("project manager") || jobTitle.toLowerCase() === "pm") {
          // Self-healing: Dynamically upsert the parallel PM Employee record if missing
          employee = await Employee.findOneAndUpdate(
            { userId: req.user.id },
            {
              userId: req.user.id,
              name: staff.name,
              fatherName: staff.fatherName || "Father",
              dob: staff.dob || new Date("1990-01-01"),
              role: "PM",
              designation: "Project Manager",
              workingState: staff.state || "Gujarat",
              workingDistrict: staff.district || "Surendranagar",
              onboardingComplete: true,
              isZoneLocked: true,
              createdBy: staff.createdBy || req.user.id
            },
            { upsert: true, new: true }
          ).populate("userId", "email phone");

          // Connect all existing RMs to this new PM
          await Employee.updateMany({ role: "RM" }, { $set: { reportingTo: employee.userId } });
        }
      }
    }

    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    const postName = employee.jobPostingId?.post?.en || employee.role || "Employee";
    const myRole = (employee.role || "").toUpperCase();
    const myPost = (postName || "").toLowerCase();

    const isDM = myRole === 'DM' || myPost.includes('district manager');
    const isBS = myRole === 'BS' || myPost.includes('block supervisor');

    const hierarchy = {
      me: {
        id: employee._id,
        _id: employee._id,
        name: employee.name,
        post: postName,
        role: employee.role,
        accountStatus: employee.status || "Active",
        phone: employee.userId?.phone,
        zone: {
          state: employee.workingState,
          district: employee.workingDistrict,
          block: employee.workingBlock?.name,
          panchayat: employee.workingPanchayat?.name,
          blocks: employee.workingBlocks?.map(b => b?.name).filter(Boolean),
          panchayats: employee.workingPanchayats?.map(p => p?.name).filter(Boolean),
          isAllBlocksAssigned: employee.isAllBlocksAssigned,
          isAllPanchayatsAssigned: employee.isAllPanchayatsAssigned
        }
      },
      upper: null,
      subordinates: [],
      isZoneLocked: employee.isZoneLocked
    };

    // 1. Fetch employees and blocks to build a complete view
    let allStateData;
    let allStateBlocks = [];
    const isPMUser = employee.role === 'PM' || (employee.designation || "").toLowerCase().includes("project manager");
    if (isPMUser) {
      allStateData = await Employee.find({})
        .populate('userId', 'email phone')
        .populate('workingBlock')
        .populate('workingBlocks')
        .populate('workingPanchayat')
        .populate('workingPanchayats')
        .populate('jobPostingId');
        
      allStateBlocks = await Block.find({}).select('name district state');
    } else {
      const myStateRaw = employee.workingState || "";
      const myStatePrimary = myStateRaw.split('/')[0].trim();
      allStateData = await Employee.find({
        workingState: { $regex: new RegExp(`^${myStatePrimary}`, 'i') }
      })
        .populate('userId', 'email phone')
        .populate('workingBlock')
        .populate('workingBlocks')
        .populate('workingPanchayat')
        .populate('workingPanchayats')
        .populate('jobPostingId');

      allStateBlocks = await Block.find({
        state: { $regex: new RegExp(`^${myStatePrimary}`, 'i') }
      }).select('name district state');

      // Also fetch the global PM and add to allStateData if not present
      const globalPMNode = await Employee.findOne({ role: 'PM' })
        .populate('userId', 'email phone')
        .populate('workingBlock')
        .populate('workingBlocks')
        .populate('workingPanchayat')
        .populate('workingPanchayats')
        .populate('jobPostingId');
      if (globalPMNode && !allStateData.some(e => e._id.toString() === globalPMNode._id.toString())) {
        allStateData.push(globalPMNode);
      }
    }

    // --- Geographic & display helpers (full bilingual labels, comparable keys) ---
    const geoNormKey = (s) => {
      if (s == null || s === '') return '';
      const t = String(s).trim().toLowerCase();
      const primary = t.split('/')[0].trim();
      return primary.replace(/\s+/g, ' ');
    };

    const geoKeysMatch = (a, b) => geoNormKey(a) && geoNormKey(b) && geoNormKey(a) === geoNormKey(b);

    const splitDistrictList = (str) =>
      (str || '')
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

    /** True if needle district matches emp's workingDistrict (single or comma-separated). */
    const districtMatchesEmp = (empDistrictCsv, needleDistrict) => {
      const needle = geoNormKey(needleDistrict);
      if (!needle) return false;
      return splitDistrictList(empDistrictCsv).some((d) => geoNormKey(d) === needle);
    };

    const stateMatches = (a, b) => geoNormKey(a) === geoNormKey(b);

    const canonicalPost = (emp) =>
      emp?.jobPostingId?.post?.en || emp?.designation || emp?.role || 'Employee';

    const slugIdPart = (s) =>
      String(s || '')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9\u0900-\u097F_-]/g, '')
        .slice(0, 80) || 'x';

    /** RM: strict — avoid PE/DM/etc. misclassified via loose substring checks on "regional". */
    const isStrictRM = (emp) => {
      if (!emp) return false;
      const r = (emp.role || '').toUpperCase();
      if (r === 'PE' || r === 'BS' || r === 'PM') return false;
      if (r === 'RM') return true;
      const p = (emp.jobPostingId?.post?.en || emp.designation || '').toLowerCase();
      if (p.includes('panchayat') && r !== 'RM') return false;
      return p.includes('regional') || p.includes('resognal');
    };

    // Helper for Robust Role Comparison (uses strict RM)
    const isRole = (emp, targetRole) => {
      if (!emp) return false;
      const r = (emp.role || "").toUpperCase();
      const d = (emp.designation || "").toLowerCase();
      const p = (emp.jobPostingId?.post?.en || "").toLowerCase();

      if (targetRole === 'PM') return r === 'PM' || d.includes('project manager') || p.includes('project manager');
      if (targetRole === 'RM') return isStrictRM(emp);
      if (targetRole === 'ZC') {
        if (r === 'PM') return false;
        return r === 'ZC' || d.includes('zonal') || p.includes('zonal');
      }
      if (targetRole === 'DM') {
        if (['PM', 'RM', 'ZC'].includes(r)) return false; // Prevent higher roles from falling back to DM
        return r === 'DM' || d.includes('district manager') || p.includes('district manager');
      }
      if (targetRole === 'BS') {
        if (['PM', 'RM', 'ZC', 'DM'].includes(r)) return false;
        return r === 'BS' || (d.includes('block') && d.includes('supervisor')) || (p.includes('block') && p.includes('supervisor'));
      }
      if (targetRole === 'PE') {
        if (['PM', 'RM', 'ZC', 'DM', 'BS'].includes(r)) return false;
        return r === 'PE' || d.includes('panchayat') || p.includes('panchayat');
      }
      return false;
    };

    // 2. Build Full Level-by-Level Path (including Vacant positions)
    const roleOrder = ['PM', 'RM', 'ZC', 'DM', 'BS', 'PE'];
    const isPM = isRole(employee, 'PM');
    const isRM = isRole(employee, 'RM');
    const computedRole = isPM ? 'PM' : (isRM ? 'RM' : (employee.role || 'DM').toUpperCase());
    let myRoleIndex = roleOrder.indexOf(computedRole);
    if (myRoleIndex === -1) myRoleIndex = 3; // Default to DM if unknown

    let currentReportingId = employee.reportingTo;
    const upperChain = [];

    // Traverse ONLY 1 level above (direct senior) — not the full chain up to RM
    // Rule: BS sees only DM, DM sees only ZC, ZC sees only RM, RM sees nothing
    const seniorLevelIndex = myRoleIndex - 1; // index of the direct senior role
    for (let i = seniorLevelIndex; i >= 0 && i === seniorLevelIndex; i--) {
      const targetRole = roleOrder[i];
      let foundOfficer = null;

      // Try 1: Explicit Reporting (Most Deterministic)
      if (currentReportingId) {
        const byReport = allStateData.find(p => (p.userId?._id || p.userId || "").toString() === currentReportingId.toString());
        if (byReport && isRole(byReport, targetRole)) foundOfficer = byReport;
      }

      // Try 2: Geographic & Block/District Overlap match for this level
      if (!foundOfficer) {
        foundOfficer = allStateData.find(p => {
          const matchesRole = isRole(p, targetRole);
          if (!matchesRole) return false;
          if (!stateMatches(p.workingState, employee.workingState)) return false;

          if (targetRole === 'PM' || targetRole === 'RM') return true;

          if (targetRole === 'ZC') {
            const myFirstDist = splitDistrictList(employee.workingDistrict)[0] || employee.workingDistrict;
            return districtMatchesEmp(p.workingDistrict, myFirstDist);
          }

          if (targetRole === 'DM') {
            // For a BS looking for a DM, the DM must manage the BS's district AND block
            const myFirstDist = splitDistrictList(employee.workingDistrict)[0] || employee.workingDistrict;
            const districtMatches = districtMatchesEmp(p.workingDistrict, myFirstDist);
            
            if (!districtMatches) return false;

            // Check block overlap
            const myBlockId = (employee.workingBlock?._id || employee.workingBlock)?.toString?.();
            if (!myBlockId) return true; // If BS has no block, just district match is enough

            // Check if DM has all blocks assigned
            if (p.isAllBlocksAssigned !== false) return true; // Default to true if undefined, as some legacy DMs might not have it set

            // Check if DM is specifically assigned to BS's block
            const dmBlockIds = [];
            if (p.workingBlock) dmBlockIds.push((p.workingBlock._id || p.workingBlock).toString());
            if (Array.isArray(p.workingBlocks)) {
              p.workingBlocks.forEach(b => dmBlockIds.push((b._id || b).toString()));
            }

            return dmBlockIds.includes(myBlockId) || dmBlockIds.length === 0;
          }

          if (targetRole === 'BS') {
            const blockId = (employee.workingBlock?._id || employee.workingBlock)?.toString?.();
            const pBlock = (p.workingBlock?._id || p.workingBlock)?.toString?.();
            
            // Basic District and Block check
            if (!blockId || !pBlock || blockId !== pBlock) return false;
            if (!districtMatchesEmp(p.workingDistrict, splitDistrictList(employee.workingDistrict)[0])) return false;

            // Strict Panchayat Check
            const myPanchayatId = (employee.workingPanchayat?._id || employee.workingPanchayat)?.toString?.();
            if (!myPanchayatId) return true; // If PE has no panchayat assigned yet, just block match is enough

            // Check if BS has all panchayats in the block assigned
            if (p.isAllPanchayatsAssigned !== false) return true; // Default to true if undefined for legacy compatibility

            // Check if BS is specifically assigned to PE's panchayat
            const bsPanchayatIds = [];
            if (p.workingPanchayat) bsPanchayatIds.push((p.workingPanchayat._id || p.workingPanchayat).toString());
            if (Array.isArray(p.workingPanchayats)) {
              p.workingPanchayats.forEach(panch => bsPanchayatIds.push((panch._id || panch).toString()));
            }

            return bsPanchayatIds.includes(myPanchayatId) || bsPanchayatIds.length === 0;
          }
          return true;
        });
      }

      if (foundOfficer) {
        upperChain.push({
          id: foundOfficer._id,
          name: foundOfficer.name,
          post: canonicalPost(foundOfficer),
          role: targetRole,
          accountStatus: foundOfficer.status || "Active",
          zone: {
            state: foundOfficer.workingState,
            district: foundOfficer.workingDistrict,
            block: foundOfficer.workingBlock?.name,
            panchayat: foundOfficer.workingPanchayat?.name,
            blocks: foundOfficer.workingBlocks?.map(b => b?.name).filter(Boolean),
            panchayats: foundOfficer.workingPanchayats?.map(p => p?.name).filter(Boolean)
          }
        });
        currentReportingId = foundOfficer.reportingTo;
      } else {
        // If no real officer at this level, inject a Vacant placeholder
        const roleNames = { 'PM': 'Project Manager', 'RM': 'Regional Manager', 'ZC': 'Zonal Coordinator', 'DM': 'District Manager', 'BS': 'Block Supervisor' };
        upperChain.push({
          id: `vacant-path-${targetRole}-${i}`,
          name: "VACANT",
          post: roleNames[targetRole],
          role: targetRole,
          isVacant: true,
          zone: { state: employee.workingState, district: employee.workingDistrict }
        });
        currentReportingId = null;
      }
    }

    // Path shows top-to-bottom: [direct senior] (single entry for non-RM roles)
    const fullPath = [...upperChain].reverse();
    hierarchy.path = fullPath;
    hierarchy.upper = fullPath.length > 0 ? fullPath[fullPath.length - 1] : null;

    // --- ROBUST TOP-DOWN HIERARCHY BUILDING ---
    try {
      const myId = (employee.userId?._id || employee.userId || "").toString().trim();
      const myState = employee.workingState;

      // 1. Fetch all employees in the same state to build a complete view
      // Redeclaration removed to fix SyntaxError
      // const allStateData = await Employee.find({ 
      /*
          workingState: { $regex: new RegExp(`^${myState}$`, 'i') } 
      })
      .populate('userId', 'email phone')
      .populate('workingBlock')
      .populate('workingPanchayat')
      .populate('jobPostingId');
      */

      // 2. Adjacency Map for quick lookup
      const nodesByUserId = {};
      const subordinatesMap = {}; // reportingToUserId -> [EmployeeNodes]

      allStateData.forEach((emp) => {
        const eId = (emp.userId?._id || emp.userId || "").toString().trim();
        const rId = (emp.reportingTo?._id || emp.reportingTo || "").toString().trim();
        const wBlockId = (emp.workingBlock?._id || emp.workingBlock || "").toString();

        const node = {
          id: emp._id,
          userId: eId,
          name: emp.name,
          post: canonicalPost(emp),
          role: emp.role?.toUpperCase(),
          accountStatus: emp.status || "Active",
          isMe: eId === myId,
          phone: emp.userId?.phone,
          email: emp.userId?.email,
          photo: emp.photo,
          workingBlockId: wBlockId || undefined,
          zone: {
            state: emp.workingState,
            district: emp.workingDistrict,
            block: emp.workingBlock?.name,
            panchayat: emp.workingPanchayat?.name,
            blocks: emp.workingBlocks?.map(b => b?.name).filter(Boolean),
            panchayats: emp.workingPanchayats?.map(p => p?.name).filter(Boolean),
            isAllBlocksAssigned: emp.isAllBlocksAssigned,
            isAllPanchayatsAssigned: emp.isAllPanchayatsAssigned
          },
          subordinates: [],
        };

        nodesByUserId[eId] = node;
        if (rId && rId !== "null") {
          if (!subordinatesMap[rId]) subordinatesMap[rId] = [];
          subordinatesMap[rId].push(node);
        }
      });

      const normalizeChildList = (raw) => {
        if (raw == null) return [];
        const arr = Array.isArray(raw) ? raw : [raw];
        return arr.filter(Boolean);
      };

      const sortSubordinates = (nodes) => {
        if (!Array.isArray(nodes)) return [];
        return [...nodes].filter(Boolean).sort((a, b) => {
          const av = a.isVacant ? 1 : 0;
          const bv = b.isVacant ? 1 : 0;
          if (av !== bv) return av - bv;
          const dA = geoNormKey(a.zone?.district || "");
          const dB = geoNormKey(b.zone?.district || "");
          if (dA !== dB) return dA.localeCompare(dB);
          const blkA = geoNormKey(a.zone?.block || "");
          const blkB = geoNormKey(b.zone?.block || "");
          if (blkA !== blkB) return blkA.localeCompare(blkB);
          const pnA = geoNormKey(a.zone?.panchayat || "");
          const pnB = geoNormKey(b.zone?.panchayat || "");
          if (pnA !== pnB) return pnA.localeCompare(pnB);
          return String(a.name || "").localeCompare(String(b.name || ""));
        });
      };

      const sanitizeSubtree = (n) => {
        if (!n || typeof n !== "object") return;
        if (!Array.isArray(n.subordinates)) n.subordinates = [];
        n.subordinates = sortSubordinates(n.subordinates.filter(Boolean));
        n.subordinates.forEach(sanitizeSubtree);
      };

      const managedDistrictNormKeysFromZCs = (zcs) => {
        const s = new Set();
        zcs.forEach((zc) => {
          splitDistrictList(zc.workingDistrict).forEach((d) => {
            const k = geoNormKey(d);
            if (k) s.add(k);
          });
        });
        return s;
      };

      /** Districts where someone works (DM/BS/PE) but no real ZC claims that district — inject vacant ZC. */
      const unmanagedDmDistrictLabels = (managedNorm) => {
        const byKey = new Map();
        allStateData.forEach((e) => {
          if (!stateMatches(e.workingState, myState)) return;
          if (!["DM", "BS", "PE"].includes(e.role)) return;
          const raw = splitDistrictList(e.workingDistrict)[0] || e.workingDistrict;
          if (!raw) return;
          const k = geoNormKey(raw);
          if (k && !managedNorm.has(k) && !byKey.has(k)) byKey.set(k, raw.trim());
        });
        return [...byKey.values()];
      };

      let buildSubTree;

      /** DM → BS → PE under one district (real or vacant DM). Injects vacant BS when PE exist but no BS node for that block. */
      const dmDistrictChildren = (dmManagerId, districtLabel, parentVacancyKey, visited) => {
        const out = [];

        const dmNodeRaw = dmManagerId ? allStateData.find(e => (e.userId?._id || e.userId).toString() === dmManagerId) : null;
        
        // If DM has isAllBlocksAssigned as false, they only manage specific blocks
        const isDmLimited = dmNodeRaw && dmNodeRaw.isAllBlocksAssigned === false;
        
        const dmBlockIds = [];
        if (isDmLimited) {
          if (dmNodeRaw.workingBlock) dmBlockIds.push((dmNodeRaw.workingBlock._id || dmNodeRaw.workingBlock).toString());
          if (Array.isArray(dmNodeRaw.workingBlocks)) {
            dmNodeRaw.workingBlocks.forEach(b => dmBlockIds.push((b._id || b).toString()));
          }
        }
        
        const employeeBlocksOverlap = (emp) => {
          if (!isDmLimited) return true;
          const empBlockIds = [];
          if (emp.workingBlock) empBlockIds.push((emp.workingBlock._id || emp.workingBlock).toString());
          if (Array.isArray(emp.workingBlocks)) {
            emp.workingBlocks.forEach(b => empBlockIds.push((b._id || b).toString()));
          }
          if (empBlockIds.length === 0) return false;
          return empBlockIds.some(id => dmBlockIds.includes(id));
        };

        const bsInDist = allStateData.filter((e) => {
          if (e.role !== "BS" || !stateMatches(e.workingState, myState)) return false;
          const explicitlyReports = dmManagerId && e.reportingTo && e.reportingTo.toString() === dmManagerId;
          if (explicitlyReports) return true;
          
          const matchesGeo = districtMatchesEmp(e.workingDistrict, districtLabel);
          return matchesGeo && employeeBlocksOverlap(e);
        });

        const addedBsIds = new Set();
        bsInDist.forEach((bs) => {
          const bsId = (bs.userId?._id || bs.userId).toString();
          if (!addedBsIds.has(bsId)) {
            const sub = buildSubTree(bsId, "BS", { state: myState, district: districtLabel }, visited);
            if (sub) out.push(sub);
            addedBsIds.add(bsId);
          }
        });

        const blockKey = (emp) => ((emp.workingBlock?._id || emp.workingBlock || "") + "").trim() || "_noblock";

        const pesInDistrict = allStateData.filter((e) => {
          if (e.role !== "PE" || !stateMatches(e.workingState, myState)) return false;
          const explicitlyReports = dmManagerId && e.reportingTo && e.reportingTo.toString() === dmManagerId;
          if (explicitlyReports) return true;
          
          const matchesGeo = districtMatchesEmp(e.workingDistrict, districtLabel);
          return matchesGeo && employeeBlocksOverlap(e);
        });

        const peByBlock = new Map();
        pesInDistrict.forEach((pe) => {
          const bid = blockKey(pe);
          if (!peByBlock.has(bid)) peByBlock.set(bid, []);
          peByBlock.get(bid).push(pe);
        });

        peByBlock.forEach((peList, bid) => {
          const hasRealBs = out.some(
            (c) => c && c.role === "BS" && !c.isVacant && bid !== "_noblock" && (c.workingBlockId || "") === bid
          );
          if (hasRealBs) return;

          const blockName = peList[0]?.workingBlock?.name || "";
          const peChildren = peList
            .map((pe) =>
              buildSubTree((pe.userId?._id || pe.userId).toString(), "PE", { state: myState, district: districtLabel }, visited)
            )
            .filter(Boolean);

          if (bid === "_noblock" && peChildren.length === 0) return;

          out.push({
            id: `vacant-bs-${slugIdPart(parentVacancyKey)}-${slugIdPart(bid)}`,
            name: "--",
            post: "Block Supervisor",
            role: "BS",
            isVacant: true,
            workingBlockId: bid === "_noblock" ? undefined : bid,
            zone: { state: myState, district: districtLabel, block: blockName || undefined },
            subordinates: sortSubordinates(peChildren),
          });
        });

        if (dmManagerId) {
          if (isDmLimited) {
            if (dmNodeRaw && Array.isArray(dmNodeRaw.workingBlocks)) {
              dmNodeRaw.workingBlocks.forEach(blockObj => {
                if (!blockObj || !blockObj._id) return;
                const bid = blockObj._id.toString();
                const isHandled = out.some(c => (c.workingBlockId || "") === bid);
                if (!isHandled) {
                  out.push({
                    id: `vacant-bs-${slugIdPart(parentVacancyKey)}-${slugIdPart(bid)}`,
                    name: "--",
                    post: "Block Supervisor",
                    role: "BS",
                    isVacant: true,
                    workingBlockId: bid,
                    zone: { state: myState, district: districtLabel, block: blockObj.name },
                    subordinates: []
                  });
                }
              });
            }
          } else {
            // DM is NOT limited (manages all blocks in district). Inject vacant BS for ALL blocks in this district.
            const districtBlocks = allStateBlocks.filter(b => geoKeysMatch(b.district, districtLabel));
            districtBlocks.forEach(blockObj => {
              const bid = blockObj._id.toString();
              const isHandled = out.some(c => (c.workingBlockId || "") === bid);
              if (!isHandled) {
                out.push({
                  id: `vacant-bs-${slugIdPart(parentVacancyKey)}-${slugIdPart(bid)}`,
                  name: "--",
                  post: "Block Supervisor",
                  role: "BS",
                  isVacant: true,
                  workingBlockId: bid,
                  zone: { state: myState, district: districtLabel, block: blockObj.name },
                  subordinates: []
                });
              }
            });
          }
        }

        return sortSubordinates(out);
      };

      /** Injects DMs under a Vacant ZC, falling back to a Vacant DM if no real DMs exist. */
      const unmanagedZcChildren = (distLabel, zcVacId, visited, targetState) => {
        const districtDMs = allStateData.filter(
          (e) => {
            if (!(e.role === "DM" || (e.designation || "").toLowerCase().includes("district manager"))) return false;
            if (targetState && !stateMatches(e.workingState, targetState)) return false;
            return districtMatchesEmp(e.workingDistrict, distLabel);
          }
        );

        const zcSubordinates = [];
        if (districtDMs.length > 0) {
          const addedDmIds = new Set();
          districtDMs.forEach((dm) => {
            const dmId = (dm.userId?._id || dm.userId).toString();
            if (!addedDmIds.has(dmId)) {
              const sub = buildSubTree(dmId, "DM", { state: myState, district: distLabel }, visited);
              if (sub) zcSubordinates.push(sub);
              addedDmIds.add(dmId);
            }
          });
        } else {
          const dmVacId = `vacant-dm-${zcVacId}-${slugIdPart(distLabel)}`;
          zcSubordinates.push({
            id: dmVacId,
            name: "--",
            post: "District Manager",
            role: "DM",
            isVacant: true,
            zone: { state: myState, district: distLabel },
            subordinates: dmDistrictChildren(null, distLabel, dmVacId, visited),
          });
        }
        return sortSubordinates(zcSubordinates);
      };

      // 3. Recursive Tree Builder with Vacancy Injection
      const buildVacantRMSubTree = (stateName, visitedSet) => {
        const rmVacId = `vacant-rm-st-${slugIdPart(stateName)}`;
        const vacantRmVisited = new Set(visitedSet);
        const rmSubordinates = [];

        const stateZCs = allStateData.filter((e) => e.role === "ZC" && stateMatches(e.workingState, stateName));
        const addedZcIds = new Set();
        const managedNorm = managedDistrictNormKeysFromZCs(stateZCs);

        stateZCs.forEach((zc) => {
          const zcId = (zc.userId?._id || zc.userId).toString();
          if (!addedZcIds.has(zcId)) {
            const sub = buildSubTree(zcId, "ZC", { state: stateName }, vacantRmVisited);
            if (sub) rmSubordinates.push(sub);
            addedZcIds.add(zcId);
          }
        });

        const getUnmanagedDistrictsForState = (managedNormKeys) => {
          const byKey = new Map();
          allStateData.forEach((e) => {
            if (!stateMatches(e.workingState, stateName)) return;
            if (!["DM", "BS", "PE"].includes(e.role)) return;
            const raw = splitDistrictList(e.workingDistrict)[0] || e.workingDistrict;
            if (!raw) return;
            const k = geoNormKey(raw);
            if (k && !managedNormKeys.has(k) && !byKey.has(k)) byKey.set(k, raw.trim());
          });
          return [...byKey.values()];
        };

        const vacantDistricts = getUnmanagedDistrictsForState(managedNorm);
        vacantDistricts.forEach((distLabel) => {
          const zcVacId = `vacant-zc-st-${slugIdPart(stateName)}-${slugIdPart(distLabel)}`;
          const inner = unmanagedZcChildren(distLabel, zcVacId, vacantRmVisited, stateName);
          rmSubordinates.push({
            id: zcVacId,
            name: "--",
            post: "Zonal Coordinator",
            role: "ZC",
            isVacant: true,
            zone: { state: stateName, district: distLabel },
            subordinates: inner,
          });
        });

        return {
          id: rmVacId,
          name: "--",
          post: "Regional Manager",
          role: "RM",
          isVacant: true,
          zone: { state: stateName },
          subordinates: sortSubordinates(rmSubordinates)
        };
      };

      buildSubTree = (managerId, levelRole, currentZone = {}, visited = new Set()) => {
        if (managerId && visited.has(managerId)) return null;
        if (managerId) visited.add(managerId);

        const node = managerId ? nodesByUserId[managerId] : null;
        let children = [];

        const roleOrd = ["PM", "RM", "ZC", "DM", "BS", "PE"];
        const nextRole = roleOrd[roleOrd.indexOf(levelRole) + 1];

        if (node) {
          const realSubs = subordinatesMap[managerId] || [];

          if (node.role === "PM") {
            const allRMs = allStateData.filter((e) => isStrictRM(e));
            const addedRmIds = new Set();
            const rmStates = new Set();

            allRMs.forEach((rm) => {
              const rmId = (rm.userId?._id || rm.userId).toString();
              if (!addedRmIds.has(rmId)) {
                if (!isPMUser && !stateMatches(rm.workingState, myState)) {
                  return;
                }
                const sub = buildSubTree(rmId, "RM", { state: rm.workingState }, visited);
                if (sub) {
                  children.push(sub);
                  rmStates.add(geoNormKey(rm.workingState));
                }
                addedRmIds.add(rmId);
              }
            });

            const systemStates = new Set();
            if (isPMUser) {
              allStateData.forEach((e) => {
                if (e.workingState) systemStates.add(e.workingState.trim());
              });
            } else {
              systemStates.add(myState);
            }

            systemStates.forEach((stateName) => {
              if (!rmStates.has(geoNormKey(stateName))) {
                const vacRm = buildVacantRMSubTree(stateName, visited);
                if (vacRm) children.push(vacRm);
              }
            });
          } else if (node.role === "RM") {
            const stateZCs = allStateData.filter((e) => e.role === "ZC" && stateMatches(e.workingState, myState));

            const addedZcIds = new Set();
            const managedNorm = managedDistrictNormKeysFromZCs(stateZCs);

            stateZCs.forEach((zc) => {
              const zcId = (zc.userId?._id || zc.userId).toString();
              if (!addedZcIds.has(zcId)) {
                const sub = buildSubTree(zcId, "ZC", { state: myState }, visited);
                if (sub) children.push(sub);
                addedZcIds.add(zcId);
              }
            });

            const vacantDistricts = unmanagedDmDistrictLabels(managedNorm);
            vacantDistricts.forEach((distLabel) => {
              const zcVacId = `vacant-zc-st-${slugIdPart(myState)}-${slugIdPart(distLabel)}`;
              const inner = unmanagedZcChildren(distLabel, zcVacId, visited, myState);
              children.push({
                id: zcVacId,
                name: "--",
                post: "Zonal Coordinator",
                role: "ZC",
                isVacant: true,
                zone: { state: myState, district: distLabel },
                subordinates: inner,
              });
            });
          } else if (node.role === "ZC") {
            const zcDistricts = splitDistrictList(node.zone.district);
            const addedDmIds = new Set();
            const zcVacBase = managerId ? `zc-${slugIdPart(managerId)}` : `zc-v`;

            zcDistricts.forEach((dist) => {
              const districtDMs = allStateData.filter(
                (e) => {
                  if (!(e.role === "DM" || (e.designation || "").toLowerCase().includes("district manager"))) return false;
                  const explicitlyReports = managerId && e.reportingTo && e.reportingTo.toString() === managerId;
                  if (!explicitlyReports && currentZone.state && !stateMatches(e.workingState, currentZone.state)) return false;
                  const matchesGeo = districtMatchesEmp(e.workingDistrict, dist);
                  return matchesGeo || explicitlyReports;
                }
              );

              if (districtDMs.length > 0) {
                districtDMs.forEach((dm) => {
                  const dmId = (dm.userId?._id || dm.userId).toString();
                  if (!addedDmIds.has(dmId)) {
                    const sub = buildSubTree(dmId, "DM", { state: myState, district: dist }, visited);
                    if (sub) children.push(sub);
                    addedDmIds.add(dmId);
                  }
                });
              } else {
                const dmVacId = `vacant-dm-${zcVacBase}-${slugIdPart(dist)}`;
                children.push({
                  id: dmVacId,
                  name: "--",
                  post: "District Manager",
                  role: "DM",
                  isVacant: true,
                  zone: { state: myState, district: dist },
                  subordinates: dmDistrictChildren(null, dist, dmVacId, visited),
                });
              }
            });
          } else if (node.role === "DM") {
            children = dmDistrictChildren(managerId, node.zone.district, `dm-${slugIdPart(managerId)}`, visited);
          } else if (node.role === "BS") {
            const bid = ((node.workingBlockId || "") + "").trim();
            const pesInBlock = allStateData.filter((e) => {
              if (e.role !== "PE") return false;
              const eBid = (e.workingBlock?._id || e.workingBlock || "").toString().trim();
              const sameBlock =
                (bid && eBid && eBid === bid) ||
                (!bid && geoNormKey(e.workingBlock?.name || "") === geoNormKey(node.zone?.block || ""));
              const explicitlyReports = managerId && e.reportingTo && e.reportingTo.toString() === managerId;
              if (explicitlyReports) return true;
              if (sameBlock) return true;
              return false;
            });
            const addedPeIds = new Set();
            pesInBlock.forEach((pe) => {
              const peId = (pe.userId?._id || pe.userId).toString();
              if (addedPeIds.has(peId)) return;
              const sub = buildSubTree(peId, "PE", { ...currentZone }, visited);
              if (sub) {
                addedPeIds.add(peId);
                children.push(sub);
              }
            });
          } else {
            children = realSubs.map((s) => buildSubTree(s.userId, nextRole, { ...currentZone }, visited)).filter(Boolean);
          }
        } else {
          if (levelRole === "PM") {
            const allRMs = allStateData.filter((e) => isStrictRM(e));
            const addedRmIds = new Set();
            const rmStates = new Set();

            allRMs.forEach((rm) => {
              const rmId = (rm.userId?._id || rm.userId).toString();
              if (!addedRmIds.has(rmId)) {
                if (!isPMUser && !stateMatches(rm.workingState, myState)) {
                  return;
                }
                const sub = buildSubTree(rmId, "RM", { state: rm.workingState }, visited);
                if (sub) {
                  children.push(sub);
                  rmStates.add(geoNormKey(rm.workingState));
                }
                addedRmIds.add(rmId);
              }
            });

            const systemStates = new Set();
            if (isPMUser) {
              allStateData.forEach((e) => {
                if (e.workingState) systemStates.add(e.workingState.trim());
              });
            } else {
              systemStates.add(myState);
            }

            systemStates.forEach((stateName) => {
              if (!rmStates.has(geoNormKey(stateName))) {
                const vacRm = buildVacantRMSubTree(stateName, visited);
                if (vacRm) children.push(vacRm);
              }
            });
          } else if (levelRole === "RM") {
            const stateZCs = allStateData.filter((e) => e.role === "ZC" && stateMatches(e.workingState, myState));
            const addedZcIds = new Set();
            stateZCs.forEach((zc) => {
              const zcId = (zc.userId?._id || zc.userId).toString();
              if (!addedZcIds.has(zcId)) {
                const sub = buildSubTree(zcId, "ZC", { state: myState }, visited);
                if (sub) children.push(sub);
                addedZcIds.add(zcId);
              }
            });
          } else if (levelRole === "ZC" && currentZone.district) {
            const districtDMs = allStateData.filter(
              (e) =>
                (e.role === "DM" || (e.designation || "").toLowerCase().includes("district manager")) &&
                districtMatchesEmp(e.workingDistrict, currentZone.district)
            );
            const addedDmIds = new Set();
            districtDMs.forEach((dm) => {
              const dmId = (dm.userId?._id || dm.userId).toString();
              if (!addedDmIds.has(dmId)) {
                const sub = buildSubTree(dmId, "DM", { ...currentZone }, visited);
                if (sub) children.push(sub);
                addedDmIds.add(dmId);
              }
            });
          } else if (levelRole === "DM" && currentZone.district) {
            children = dmDistrictChildren(null, currentZone.district, `dm-v-${slugIdPart(currentZone.district)}`, visited);
          }
        }

        if (node) {
          const roleNames = { 'PM': 'Project Manager', 'RM': 'Regional Manager', 'ZC': 'Zonal Coordinator', 'DM': 'District Manager', 'BS': 'Block Supervisor', 'PE': 'Panchayat Executive' };
          node.role = levelRole;
          node.post = roleNames[levelRole] || node.post;
          node.subordinates = sortSubordinates(children.filter(Boolean));
          return node;
        }
        return children.length > 0 ? sortSubordinates(children.filter(Boolean)) : null;
      };

      // 4. Find the Root PM or RM for the state and build FULL tree first
      const statePM = allStateData.find((emp) => isRole(emp, "PM"));
      const stateRM = allStateData.find((emp) => isStrictRM(emp) && stateMatches(emp.workingState, myState));

      let fullTree = null;
      if (statePM) {
        fullTree = buildSubTree((statePM.userId?._id || statePM.userId).toString(), "PM", { state: statePM.workingState || myState });
      } else if (stateRM) {
        const pmVacId = `vacant-pm-${slugIdPart(myState)}`;
        const vacantPmVisited = new Set();
        const pmSubordinates = [];

        const rmSub = buildSubTree((stateRM.userId?._id || stateRM.userId).toString(), "RM", { state: myState }, vacantPmVisited);
        if (rmSub) pmSubordinates.push(rmSub);

        fullTree = {
          id: pmVacId,
          name: "--",
          post: "Project Manager",
          role: "PM",
          isVacant: true,
          zone: { state: myState },
          subordinates: pmSubordinates
        };
      } else {
        const pmVacId = `vacant-pm-${slugIdPart(myState)}`;
        const rmVacId = `vacant-rm-${slugIdPart(myState)}`;

        const vacantPmVisited = new Set();
        const rmSubordinates = [];
        const stateZCsVacantRm = allStateData.filter((e) => e.role === "ZC" && stateMatches(e.workingState, myState));
        const addedZcIdsVac = new Set();
        const managedNorm = managedDistrictNormKeysFromZCs(stateZCsVacantRm);

        stateZCsVacantRm.forEach((zc) => {
          const zcId = (zc.userId?._id || zc.userId).toString();
          if (!addedZcIdsVac.has(zcId)) {
            const sub = buildSubTree(zcId, "ZC", { state: myState }, vacantPmVisited);
            if (sub) rmSubordinates.push(sub);
            addedZcIdsVac.add(zcId);
          }
        });

        const vacantDistricts = unmanagedDmDistrictLabels(managedNorm);
        vacantDistricts.forEach((distLabel) => {
          const zcVacId = `vacant-zc-st-${slugIdPart(myState)}-${slugIdPart(distLabel)}`;
          rmSubordinates.push({
            id: zcVacId,
            name: "--",
            post: "Zonal Coordinator",
            role: "ZC",
            isVacant: true,
            zone: { state: myState, district: distLabel },
            subordinates: unmanagedZcChildren(distLabel, zcVacId, vacantPmVisited),
          });
        });

        fullTree = {
          id: pmVacId,
          name: "--",
          post: "Project Manager",
          role: "PM",
          isVacant: true,
          zone: { state: myState },
          subordinates: [
            {
              id: rmVacId,
              name: "--",
              post: "Regional Manager",
              role: "RM",
              isVacant: true,
              zone: { state: myState },
              subordinates: sortSubordinates(rmSubordinates)
            }
          ]
        };
      }

      if (fullTree) sanitizeSubtree(fullTree);

      // 5. SCOPED TREE SELECTION — Return only the relevant portion based on login role
      // Rule: show only 1 level senior above self + self + all subordinates below
      const findNodeInTree = (node, targetId) => {
        if (!node) return null;
        const nId = (node.id || "").toString();
        if (nId === targetId) return node;
        for (const sub of (node.subordinates || [])) {
          const found = findNodeInTree(sub, targetId);
          if (found) return found;
        }
        return null;
      };

      const myRoleUpper = isPM ? "PM" : (isRM ? "RM" : (employee.role || "").toUpperCase());

      let scopedRoot;

      if (myRoleUpper === "PM" || myRoleUpper === "RM") {
        // PM and RM see full tree
        scopedRoot = fullTree;
      } else {
        // For non-RM roles: find direct senior node (1 level above) as root
        // path[] is top-to-bottom, last item = immediate senior
        const seniorPathItem = hierarchy.path && hierarchy.path.length > 0
          ? hierarchy.path[hierarchy.path.length - 1]
          : null;

        let seniorNode = null;

        if (seniorPathItem && !seniorPathItem.isVacant) {
          // Find that senior in the full tree by their employee _id
          seniorNode = findNodeInTree(fullTree, (seniorPathItem.id || "").toString());
        }

        if (!seniorNode) {
          // Senior is vacant or not found — build a focused vacant senior node
          const roleNames = {
            RM: "Regional Manager",
            ZC: "Zonal Coordinator",
            DM: "District Manager",
            BS: "Block Supervisor",
          };
          const roleOrder2 = ["RM", "ZC", "DM", "BS", "PE"];
          const myIdx = roleOrder2.indexOf(myRoleUpper);
          const seniorRole = myIdx > 0 ? roleOrder2[myIdx - 1] : "RM";

          // Find self node to attach as subordinate under vacant senior
          const myEmpId = (employee._id || "").toString();
          const selfNode = findNodeInTree(fullTree, myEmpId);

          scopedRoot = {
            id: seniorPathItem?.id || `vacant-${seniorRole.toLowerCase()}-for-${myEmpId}`,
            name: "--",
            post: roleNames[seniorRole] || seniorRole,
            role: seniorRole,
            isVacant: true,
            zone: { state: employee.workingState, district: employee.workingDistrict },
            subordinates: selfNode ? [selfNode] : [],
          };
        } else {
          scopedRoot = seniorNode;
        }
      }

      hierarchy.fullTree = scopedRoot;
      hierarchy.root = scopedRoot;
      hierarchy.subordinates = normalizeChildList(scopedRoot?.subordinates);


    } catch (treeError) {
      console.error("Critical Tree Building Error:", treeError);
      hierarchy.subordinates = [];
    }

    res.json({ success: true, data: hierarchy });
  } catch (error) {
    console.error("Hierarchy Error:", error);
    res.status(500).json({ error: "Failed to fetch hierarchy" });
  }
});

// @desc    Get employee onboarding status
// @route   GET /api/employees/onboarding-status
// @access  Private
router.get("/onboarding-status", authenticate, async (req, res) => {
  try {
    let employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      // LAZY MIGRATION: Check if they have a paid application or MOU (prioritize paid MOUs)
      let application = await Application.findOne({
        createdBy: req.user.id,
        mouStatus: "paid"
      }).populate("jobPostingId");

      if (!application) {
        application = await Application.findOne({
          createdBy: req.user.id,
          paymentStatus: "paid"
        }).populate("jobPostingId");
      }

      if (application) {
        const postCodeMap = {
          "District Manager": "DM",
          "Block Supervisor": "BS",
          "Panchayat Executive": "PE",
          "Block Supervisor cum Panchayat Executive": "BS"
        };

        const postName = application.jobPostingId?.post?.en || application.post || "District Manager";

        employee = await Employee.create({
          userId: req.user.id,
          name: application.candidateName,
          fatherName: application.fatherName,
          dob: application.dob,
          jobPostingId: application.jobPostingId?._id || application.jobPostingId,
          motherName: application.motherName,
          panNumber: application.pan,
          aadharNumber: application.aadhar,
          nationality: application.nationality || "indian",
          maritalStatus: application.maritalStatus,
          handicapDisability: application.handicapDisability,
          language: application.languageKnown,
          villageTola: application.address,
          gramPanchayat: application.panchayat,
          blockKhand: application.block,
          district: application.district,
          state: application.state,
          country: application.country || "India",
          wardNo: application.wardNo,
          post: application.postOffice,
          policeStation: application.policeStation,
          pincode: application.pincode,
          educationDetails: application.educationDetails,
          accountHolderName: application.accountHolderName,
          bankName: application.bankName,
          accountNumber: application.accountNumber,
          ifscCode: application.ifscCode,
          branchName: application.branchName,
          nomineeName: application.nomineeName,
          nomineeRelation: application.nomineeRelation,
          nomineeAge: application.nomineeAge,
          nomineeAadhar: application.nomineeAadhar,
          nomineeMobile: application.nomineeMobile,
          nomineeEmail: application.nomineeEmail,
          aadharFront: application.aadharFront,
          aadharBack: application.aadharBack,
          panCard: application.panCard,
          bankDoc: application.bankDoc,
          photo: application.photo,
          signature: application.signature,
          onboardingComplete: true, // AUTO-COMPLETE for applicants
          status: "Active",
          createdBy: application.createdBy || req.user.id,
          role: postCodeMap[postName] || "DM",
          designation: postName
        });
        // Sync name to User model
        await User.findByIdAndUpdate(req.user.id, { name: application.candidateName });
        console.log(`✅ Lazy-migrated Employee record and synced name for ${application.candidateName} to ${postName}`);
      } else {
        return res.json({
          success: true,
          onboardingComplete: false,
          role: req.user.role,
          designation: "Pending Activation"
        });
      }
    } else if (!employee.onboardingComplete) {
      // If employee record exists but marked incomplete, check for any paid application
      console.log(`🔍 Checking paid applications for existing employee: ${employee.name} (${req.user.id})`);
      const application = await Application.findOne({
        createdBy: req.user.id,
        $or: [
          { mouStatus: { $regex: /^paid$/i } },
          { paymentStatus: { $regex: /^paid$/i } }
        ]
      });

      if (application) {
        employee.onboardingComplete = true;
        await employee.save();
        console.log(`✅ Auto-completed onboarding for existing employee ${employee.name} based on paid application ${application.applicationNumber}.`);
      } else {
        console.log(`ℹ️ No paid application found for employee ${employee.name}. Staying in onboarding.`);
      }
    }

    // Check completion steps (for UI progress indicators)
    const steps = {
      personalInfo: !!(employee.name && employee.fatherName && employee.dob),
      address: !!(employee.state && employee.district),
      documents: !!(employee.aadharFront && employee.photo && employee.signature),
      bankDetails: !!(employee.accountNumber && employee.ifscCode),
      zoneLocked: employee.isZoneLocked || false
    };

    res.json({
      success: true,
      steps,
      onboardingComplete: employee.onboardingComplete || false,
      role: employee.role,
      designation: employee.designation
    });
  } catch (error) {
    console.error("Onboarding Status Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Get referred applications for current employee
// @route   GET /api/employees/my-referrals
// @access  Private
router.get("/my-referrals", authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // We fetch applications where referredBy is this employee's _id
    const { default: Application } = await import("../models/Application.js");
    const referrals = await Application.find({ referredBy: employee._id })
      .populate("jobPostingId", "title post")
      .sort({ createdAt: -1 });

    res.json(referrals);
  } catch (error) {
    console.error("My Referrals Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Complete employee onboarding
// @route   POST /api/employees/complete-onboarding
// @access  Private
router.post("/complete-onboarding", authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    // Update fields from form
    const updateData = { ...req.body };

    // Ensure onboarding is marked complete
    updateData.onboardingComplete = true;

    const updatedEmployee = await Employee.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true }
    );

    // Sync name to User model if name was updated
    if (updateData.name) {
      await User.findByIdAndUpdate(req.user.id, { name: updateData.name });
    }

    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    console.error("Complete Onboarding Error:", error);
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
});

// @desc    Lock employee working zone
// @route   POST /api/employees/lock-zone
// @access  Private
router.post("/lock-zone", authenticate, async (req, res) => {
  try {
    const { workingState, workingDistrict, workingBlock, workingPanchayat } = req.body;

    const employee = await Employee.findOne({ userId: req.user.id }).populate("jobPostingId");
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    // ROBUST ROLE DETECTION for DM
    const myRole = (employee.role || "").toUpperCase();
    const myPost = (employee.jobPostingId?.post?.en || employee.designation || "").toLowerCase();

    const isDM = myRole === 'DM' || myPost.includes('district manager');

    // Validation based on role and frontend keys
    if (!workingDistrict) {
      return res.status(400).json({ error: "District is required to lock zone" });
    }

    // Block is ONLY required for non-DM roles (BS, PE, etc.)
    if (!isDM && !workingBlock) {
      return res.status(400).json({ error: "Block is required for your role" });
    }

    // --- DOUBLE-BOOKING PREVENTION ---
    let occupiedQuery = { isZoneLocked: true };
    const checkRole = myRole || (myPost.includes('panchayat') ? 'PE' : myPost.includes('block') ? 'BS' : 'DM');

    if (checkRole === 'DM') {
      occupiedQuery.$or = [{ role: 'DM' }, { designation: { $regex: 'district manager', $options: 'i' } }];
      occupiedQuery.workingDistrict = workingDistrict;
    } else if (checkRole === 'BS') {
      occupiedQuery.$or = [{ role: 'BS' }, { designation: { $regex: 'block supervisor', $options: 'i' } }];
      occupiedQuery.workingBlock = workingBlock;
    } else if (checkRole === 'PE') {
      occupiedQuery.$or = [{ role: 'PE' }, { designation: { $regex: 'panchayat executive', $options: 'i' } }];
      occupiedQuery.workingPanchayat = workingPanchayat;
    }

    const alreadyOccupied = await Employee.findOne(occupiedQuery);
    if (alreadyOccupied && alreadyOccupied._id.toString() !== employee._id.toString()) {
      return res.status(400).json({ error: "This zone is already locked by another employee. Please refresh and select an available zone." });
    }

    // Update zone fields
    if (workingState) employee.workingState = workingState;
    employee.workingDistrict = workingDistrict;
    if (workingBlock) employee.workingBlock = workingBlock;
    if (workingPanchayat) employee.workingPanchayat = workingPanchayat;

    employee.isZoneLocked = true;

    // PERSIST ROLE & DESIGNATION (Crucial for hierarchy queries)
    employee.role = myRole;
    employee.designation = employee.jobPostingId?.post?.en || employee.designation;

    // --- AUTOMATIC HIERARCHY BUILDING ---
    console.log(`🔗 Building hierarchy for ${employee.name} (${myRole})...`);

    // 1. Find manager for current employee
    if (myRole === "PE" || myPost.includes("panchayat executive")) {
      // PE reports to BS in the same block
      const bs = await Employee.findOne({
        role: { $in: ["BS", "Block Supervisor"] },
        workingBlock: employee.workingBlock,
        isZoneLocked: true
      });
      if (bs) {
        employee.reportingTo = bs.userId;
        console.log(`✅ Assigned BS ${bs.name} as manager for PE ${employee.name}`);
      }
    } else if (myRole === "BS" || myPost.includes("block supervisor")) {
      // BS reports to DM in the same district
      const dm = await Employee.findOne({
        role: { $in: ["DM", "District Manager"] },
        workingDistrict: employee.workingDistrict,
        isZoneLocked: true
      });
      if (dm) {
        employee.reportingTo = dm.userId;
        console.log(`✅ Assigned DM ${dm.name} as manager for BS ${employee.name}`);
      }
    } else if (isDM) {
      // DM reports to Zonal Coordinator of this district
      const zc = await Employee.findOne({
        role: { $in: ["ZC", "Zonal Coordinator"] },
        workingDistrict: { $regex: employee.workingDistrict, $options: 'i' },
        isZoneLocked: true
      });
      if (zc) {
        employee.reportingTo = zc.userId;
        console.log(`✅ Assigned ZC ${zc.name} as manager for DM ${employee.name}`);
      } else {
        employee.reportingTo = null;
      }
    } else if (myRole === "ZC" || myPost.includes("zonal coordinator")) {
      // ZC reports to RM of this state
      const rm = await Employee.findOne({
        role: { $in: ["RM", "Regional Manager"] },
        workingState: employee.workingState,
        isZoneLocked: true
      });
      if (rm) {
        employee.reportingTo = rm.userId;
        console.log(`✅ Assigned RM ${rm.name} as manager for ZC ${employee.name}`);
      } else {
        employee.reportingTo = null;
      }
    }

    await employee.save();

    // 2. Claim subordinates (if this employee is a manager)
    if (isDM) {
      // DM claims all BS in the district who don't have a manager
      const result = await Employee.updateMany(
        {
          workingDistrict: employee.workingDistrict,
          role: { $in: ["BS", "Block Supervisor"] },
          reportingTo: null,
          isZoneLocked: true,
          _id: { $ne: employee._id }
        },
        { $set: { reportingTo: employee.userId } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ DM ${employee.name} claimed ${result.modifiedCount} BS subordinates.`);
      }
    } else if (myRole === "BS" || myPost.includes("block supervisor")) {
      // BS claims all PE in the block who don't have a manager
      const result = await Employee.updateMany(
        {
          workingBlock: employee.workingBlock,
          role: { $in: ["PE", "Panchayat Executive"] },
          reportingTo: null,
          isZoneLocked: true,
          _id: { $ne: employee._id }
        },
        { $set: { reportingTo: employee.userId } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ BS ${employee.name} claimed ${result.modifiedCount} PE subordinates.`);
      }
    } else if (myRole === "ZC" || myPost.includes("zonal coordinator")) {
      // ZC claims all DMs in their assigned districts who don't have a manager
      const myDistricts = (employee.workingDistrict || "").split(",").map(d => d.trim()).filter(Boolean);
      const result = await Employee.updateMany(
        {
          workingDistrict: { $in: myDistricts },
          role: { $in: ["DM", "District Manager"] },
          reportingTo: null,
          isZoneLocked: true,
          _id: { $ne: employee._id }
        },
        { $set: { reportingTo: employee.userId } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ ZC ${employee.name} claimed ${result.modifiedCount} DM subordinates.`);
      }
    }

    res.json({
      success: true,
      message: "Zone locked and hierarchy updated successfully",
      data: {
        state: employee.workingState,
        district: employee.workingDistrict,
        block: employee.workingBlock,
        panchayat: employee.workingPanchayat,
        isZoneLocked: employee.isZoneLocked,
        reportingTo: employee.reportingTo
      }
    });
  } catch (error) {
    console.error("Lock Zone Error:", error);
    res.status(500).json({ error: "Failed to lock zone" });
  }
});

// @desc    Get occupied zones by post/role
// @route   GET /api/employees/occupied-zones
// @access  Private
router.get("/occupied-zones", authenticate, async (req, res) => {
  try {
    const { role, state, district, block } = req.query;

    let query = { isZoneLocked: true };
    if (role) {
      if (role === 'DM') {
        query.$or = [{ role: 'DM' }, { designation: { $regex: 'district manager', $options: 'i' } }];
      } else if (role === 'BS') {
        query.$or = [{ role: 'BS' }, { designation: { $regex: 'block supervisor', $options: 'i' } }];
      } else if (role === 'PE') {
        query.$and = [
          { $or: [{ role: 'PE' }, { designation: { $regex: 'panchayat executive', $options: 'i' } }] },
          { designation: { $not: /Block Supervisor/i } }
        ];
      } else if (role === 'RM') {
        query.$or = [{ role: 'RM' }, { designation: { $regex: 'regional manager', $options: 'i' } }];
      } else if (role === 'ZC') {
        query.$or = [{ role: 'ZC' }, { designation: { $regex: 'zonal coordinator', $options: 'i' } }];
      } else {
        query.role = role;
      }
    }

    if (state && state !== 'undefined' && state !== 'null') query.workingState = state;
    if (district && district !== 'undefined' && district !== 'null') query.workingDistrict = district;
    if (block && block !== 'undefined' && block !== 'null') query.workingBlock = block;

    const employees = await Employee.find(query).select('workingState workingDistrict workingBlock workingPanchayat');

    let occupied = [];
    if (role === 'RM') {
      occupied = employees.map(e => e.workingState).filter(Boolean);
    } else if (role === 'ZC') {
      employees.forEach(e => {
        if (e.workingDistrict) {
          e.workingDistrict.split(',').forEach(d => occupied.push(d.split('/')[0].trim()));
        }
      });
    } else if (role === 'DM') {
      occupied = employees.map(e => e.workingDistrict).filter(Boolean);
    } else if (role === 'BS') {
      occupied = employees.map(e => e.workingBlock?.toString()).filter(Boolean);
    } else if (role === 'PE') {
      occupied = employees.map(e => e.workingPanchayat?.toString()).filter(Boolean);
    }

    res.json({ success: true, data: [...new Set(occupied)] });
  } catch (error) {
    console.error("Occupied Zones Error:", error);
    res.status(500).json({ error: "Failed to fetch occupied zones" });
  }
});

// @desc    Get all matched locked employee IDs for global select all
// @route   GET /api/employees/zone-eligible/ids
// @access  Admin / RM Only
router.get("/zone-eligible/ids", authenticate, async (req, res) => {
  try {
    let isRM = false;
    let isZC = false;
    let loggedEmployee = null;

    if (req.user.role === 'employee') {
      loggedEmployee = await Employee.findOne({ userId: req.user.id });
      if (loggedEmployee) {
        if (loggedEmployee.role === 'RM') isRM = true;
        if (loggedEmployee.role === 'ZC') isZC = true;
      }
    }

    if (!['admin', 'superadmin', 'staff'].includes(req.user.role) && !isRM && !isZC) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { search, filterType, role, state, district, block, panchayat, empType } = req.query;

    const Application = mongoose.model("Application");
    const Attempt = mongoose.model("Attempt");

    // 1. Get userIds of fully converted MOU candidates
    const convertedAttempts = await Attempt.find({ mouStatus: "ConvertedEmployee" }).select("userId createdAt");
    let convertedUserIds = convertedAttempts.map(a => a.userId);

    // Apply empType filtering globally if requested
    if (empType && empType !== "All") {
      const allApps = await Application.find({ createdBy: { $in: convertedUserIds } }).select("createdBy mouPaidAt");
      const targetDate = new Date('2026-07-01T00:00:00Z');
      
      const filteredConvertedUserIds = [];
      for (const attempt of convertedAttempts) {
        const app = allApps.find(a => a.createdBy.toString() === attempt.userId.toString());
        const checkDate = (app && app.mouPaidAt) ? new Date(app.mouPaidAt) : new Date(attempt.createdAt);
        const isNew = checkDate >= targetDate;
        
        if (empType === "New" && isNew) filteredConvertedUserIds.push(attempt.userId);
        if (empType === "Old" && !isNew) filteredConvertedUserIds.push(attempt.userId);
      }
      convertedUserIds = filteredConvertedUserIds;
    }

    // 2. Get userIds of candidates who paid for MOU (they are NOT manual)
    const paidApps = await Application.find({ mouStatus: "paid" }).select("createdBy");
    const paidUserIds = paidApps.map(a => a.createdBy);

    // Build query for Employee (only fetch locked ones, as they are select-all targets)
    let employeeQuery = { isZoneLocked: true, $and: [] };

    if (empType && empType !== "All") {
      employeeQuery.$and.push({ userId: { $in: convertedUserIds } });
    } else {
      employeeQuery.$and.push({
        $or: [
          { userId: { $in: convertedUserIds } },
          { 
            userId: { $nin: paidUserIds }, 
            onboardingComplete: true 
          }
        ]
      });
    }

    const cleanStateName = (s) => (s || "").split('/')[0].trim();

    if (search) {
      employeeQuery.$and = employeeQuery.$and || [];
      employeeQuery.$and.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { workingDistrict: { $regex: search, $options: "i" } }
        ]
      });
    }

    if (filterType === "unlocked") {
      // Unlocked zones can't be locked anyway, but if filterType is set to unlocked we return empty
      return res.json({ success: true, ids: [] });
    }

    // Role filter for zone management
    if (role && role !== "all") {
      const roleUpper = role.toUpperCase();
      if (roleUpper === 'PE') {
        employeeQuery.role = 'PE';
        employeeQuery.designation = { $not: /Block Supervisor/i };
      } else {
        employeeQuery.role = roleUpper;
      }
    }

    // State filter
    const stateFilter = isRM ? loggedEmployee.workingState : state;
    if (stateFilter && stateFilter !== "all" && !isRM) {
      const stateClean = cleanStateName(stateFilter);
      const stateRegex = new RegExp(`^${stateClean}`, "i");
      employeeQuery.$and = employeeQuery.$and || [];
      employeeQuery.$and.push({
        $or: [
          { workingState: { $regex: stateRegex } },
          { state: { $regex: stateRegex } }
        ]
      });
    } else if (isRM && loggedEmployee) {
      const rmStateClean = cleanStateName(loggedEmployee.workingState);
      const stateRegex = new RegExp(`^${rmStateClean}`, "i");
      employeeQuery.$and = employeeQuery.$and || [];
      employeeQuery.$and.push({
        $or: [
          { workingState: { $regex: stateRegex } },
          { state: { $regex: stateRegex } }
        ]
      });
    }

    // ZC override for District
    if (isZC && loggedEmployee) {
      const zcDistricts = loggedEmployee.workingDistrict ? loggedEmployee.workingDistrict.split(",").map(d => d.split('/')[0].trim()) : [];
      if (zcDistricts.length > 0) {
        const orConditions = zcDistricts.map(d => ({ workingDistrict: { $regex: new RegExp(`^${d}`, "i") } }));
        orConditions.push(...zcDistricts.map(d => ({ district: { $regex: new RegExp(`^${d}`, "i") } })));
        employeeQuery.$and = employeeQuery.$and || [];
        employeeQuery.$and.push({ $or: orConditions });
      } else {
        employeeQuery._id = null; // No districts assigned, see no one
      }
    }

    // District filter
    if (district && district !== "all") {
      const distRegex = new RegExp(district, "i");
      employeeQuery.$and = employeeQuery.$and || [];
      employeeQuery.$and.push({
        $or: [
          { workingDistrict: { $regex: distRegex } },
          { district: { $regex: distRegex } }
        ]
      });
    }

    // Block filter
    let blockIdFilter = null;
    if (block && block !== "all") {
      try {
        const Block = mongoose.models.Block || mongoose.model("Block");
        const matchedBlocks = await Block.find({ name: { $regex: new RegExp(block, "i") } }).select("_id");
        blockIdFilter = matchedBlocks.map(b => b._id);
        if (blockIdFilter.length > 0) {
          employeeQuery.$and = employeeQuery.$and || [];
          employeeQuery.$and.push({
            $or: [
              { workingBlock: { $in: blockIdFilter } },
              { workingBlocks: { $in: blockIdFilter } }
            ]
          });
        }
      } catch (blockErr) { }
    }

    // Panchayat filter
    if (panchayat && panchayat !== "all") {
      try {
        const Panchayat = mongoose.models.Panchayat || mongoose.model("Panchayat");
        const matchedPanchayats = await Panchayat.find({ name: { $regex: new RegExp(panchayat, "i") } }).select("_id");
        const panchayatIds = matchedPanchayats.map(p => p._id);
        if (panchayatIds.length > 0) {
          employeeQuery.$and = employeeQuery.$and || [];
          employeeQuery.$and.push({
            $or: [
              { workingPanchayat: { $in: panchayatIds } },
              { workingPanchayats: { $in: panchayatIds } }
            ]
          });
        }
      } catch (panchErr) { }
    }

    const employees = await Employee.find(employeeQuery).select("_id");
    res.json({ success: true, ids: employees.map(emp => emp._id) });
  } catch (error) {
    console.error("Zone Eligible IDs Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Get filter counts for zone management
// @route   GET /api/employees/zone-eligible/filter-counts
// @access  Admin / RM Only
router.get("/zone-eligible/filter-counts", authenticate, async (req, res) => {
  try {
    let isRM = false;
    let isZC = false;
    let loggedEmployee = null;

    if (req.user.role === 'employee') {
      loggedEmployee = await Employee.findOne({ userId: req.user.id });
      if (loggedEmployee) {
        if (loggedEmployee.role === 'RM') isRM = true;
        if (loggedEmployee.role === 'ZC') isZC = true;
      }
    }

    if (!['admin', 'superadmin', 'staff'].includes(req.user.role) && !isRM && !isZC) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { state, district, block, role } = req.query;

    let matchQuery = { isZoneLocked: true };
    if (isRM) {
      matchQuery.workingState = { $regex: new RegExp(`^${loggedEmployee.workingState}`, "i") };
    }
    if (isZC && loggedEmployee) {
      const zcDistricts = loggedEmployee.workingDistrict ? loggedEmployee.workingDistrict.split(",").map(d => d.split('/')[0].trim()) : [];
      if (zcDistricts.length > 0) {
        const orConditions = zcDistricts.map(d => ({ workingDistrict: { $regex: new RegExp(`^${d}`, "i") } }));
        matchQuery.$or = orConditions;
      } else {
        matchQuery._id = null;
      }
    }

    if (role && role !== "all") {
      const roleUpper = role.toUpperCase();
      if (roleUpper === 'PE') {
        matchQuery.role = 'PE';
        matchQuery.designation = { $not: /Block Supervisor/i };
      } else {
        matchQuery.role = roleUpper;
      }
    }

    const employees = await Employee.find(matchQuery)
      .populate("workingBlock", "name")
      .populate("workingPanchayat", "name")
      .select("workingState workingDistrict workingBlock workingPanchayat role");

    const states = {};
    const districts = {};
    const blocks = {};
    const panchayats = {};

    employees.forEach(emp => {
      // State counts
      if (emp.workingState) {
        states[emp.workingState] = (states[emp.workingState] || 0) + 1;
      }

      // District counts (filtered by state if provided or forced by RM/ZC)
      const cleanStateName = (s) => (s || "").split('/')[0].trim().toLowerCase();
      const stateFilter = isRM ? cleanStateName(loggedEmployee.workingState) : cleanStateName(state);
      if (stateFilter && emp.workingState && !emp.workingState.toLowerCase().startsWith(stateFilter)) return;
      if (emp.workingDistrict) {
        districts[emp.workingDistrict] = (districts[emp.workingDistrict] || 0) + 1;
      }

      // Block counts (filtered by district if provided)
      if (district && emp.workingDistrict && emp.workingDistrict.toLowerCase() !== district.toLowerCase()) return;
      if (emp.workingBlock && emp.workingBlock.name) {
        blocks[emp.workingBlock.name] = (blocks[emp.workingBlock.name] || 0) + 1;
      }

      // Panchayat counts (filtered by block if provided)
      if (block && emp.workingBlock && emp.workingBlock.name && emp.workingBlock.name.toLowerCase() !== block.toLowerCase()) return;
      if (emp.workingPanchayat && emp.workingPanchayat.name) {
        panchayats[emp.workingPanchayat.name] = (panchayats[emp.workingPanchayat.name] || 0) + 1;
      }
    });

    res.json({ success: true, data: { states, districts, blocks, panchayats } });
  } catch (error) {
    console.error("Zone Filter Counts Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Get all filter counts for global filters (Attendance etc)
// @route   GET /api/employees/all-filter-counts
// @access  Admin Only
router.get("/all-filter-counts", authenticate, async (req, res) => {
  try {
    if (!['admin', 'superadmin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { state, district, block, designation, role, manualOnly } = req.query;

    let matchQuery = {};
    if (designation && designation !== "all") {
      matchQuery.designation = new RegExp(`^${designation}$`, "i");
    }
    if (role && role !== "all") {
      const roleUpper = role.toUpperCase();
      if (roleUpper === 'PE') {
        matchQuery.role = 'PE';
        matchQuery.designation = { $not: /Block Supervisor/i };
      } else {
        matchQuery.role = roleUpper;
      }
    }
    if (manualOnly === 'true') {
      const Application = mongoose.model("Application") || require("../models/Application.js");
      const paidApps = await Application.find({ mouStatus: "paid" }).select("createdBy");
      const paidUserIds = paidApps.map(app => app.createdBy);
      matchQuery.userId = { $nin: paidUserIds };
    }

    const employees = await Employee.find(matchQuery)
      .populate("workingBlock", "name")
      .populate("workingPanchayat", "name")
      .select("workingState workingDistrict workingBlock workingPanchayat designation");

    const states = {};
    const districts = {};
    const blocks = {};
    const panchayats = {};

    const cleanStateName = (s) => (s || "").split('/')[0].trim().toLowerCase();

    employees.forEach(emp => {
      // State counts
      if (emp.workingState) {
        states[emp.workingState] = (states[emp.workingState] || 0) + 1;
      }

      // District counts
      if (state && emp.workingState && !emp.workingState.toLowerCase().startsWith(cleanStateName(state))) return;
      if (emp.workingDistrict) {
        districts[emp.workingDistrict] = (districts[emp.workingDistrict] || 0) + 1;
      }

      // Block counts
      if (district && emp.workingDistrict && emp.workingDistrict.toLowerCase() !== district.toLowerCase()) return;
      if (emp.workingBlock && emp.workingBlock.name) {
        blocks[emp.workingBlock.name] = (blocks[emp.workingBlock.name] || 0) + 1;
      }

      // Panchayat counts
      if (block && emp.workingBlock && emp.workingBlock.name && emp.workingBlock.name.toLowerCase() !== block.toLowerCase()) return;
      if (emp.workingPanchayat && emp.workingPanchayat.name) {
        panchayats[emp.workingPanchayat.name] = (panchayats[emp.workingPanchayat.name] || 0) + 1;
      }
    });

    res.json({ success: true, data: { states, districts, blocks, panchayats } });
  } catch (error) {
    console.error("All Filter Counts Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Get employees eligible for zone management (paid exam or mou fee)
// @route   GET /api/employees/zone-eligible
// @access  Admin / RM Only
router.get("/zone-eligible", authenticate, async (req, res) => {
  try {
    let isRM = false;
    let isZC = false;
    let loggedEmployee = null;

    if (req.user.role === 'employee') {
      loggedEmployee = await Employee.findOne({ userId: req.user.id });
      if (loggedEmployee) {
        if (loggedEmployee.role === 'RM') isRM = true;
        if (loggedEmployee.role === 'ZC') isZC = true;
      }
    }

    if (!['admin', 'superadmin', 'staff'].includes(req.user.role) && !isRM && !isZC) {
      return res.status(403).json({ error: "Access denied" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const { search, filterType, role, state, district, block, panchayat, empType } = req.query;

    const Application = mongoose.model("Application");
    const Attempt = mongoose.model("Attempt");

    // 1. Get userIds of fully converted MOU candidates
    const convertedAttempts = await Attempt.find({ mouStatus: "ConvertedEmployee" }).select("userId createdAt");
    let convertedUserIds = convertedAttempts.map(a => a.userId);

    // Apply empType filtering globally if requested
    if (empType && empType !== "All") {
      const allApps = await Application.find({ createdBy: { $in: convertedUserIds } }).select("createdBy mouPaidAt");
      const targetDate = new Date('2026-07-01T00:00:00Z');
      
      const filteredConvertedUserIds = [];
      for (const attempt of convertedAttempts) {
        const app = allApps.find(a => a.createdBy.toString() === attempt.userId.toString());
        const checkDate = (app && app.mouPaidAt) ? new Date(app.mouPaidAt) : new Date(attempt.createdAt);
        const isNew = checkDate >= targetDate;
        
        if (empType === "New" && isNew) filteredConvertedUserIds.push(attempt.userId);
        if (empType === "Old" && !isNew) filteredConvertedUserIds.push(attempt.userId);
      }
      convertedUserIds = filteredConvertedUserIds;
    }

    // 2. Get userIds of candidates who paid for MOU (they are NOT manual)
    const paidApps = await Application.find({ mouStatus: "paid" }).select("createdBy");
    const paidUserIds = paidApps.map(a => a.createdBy);

    // Build query for Employee: Must be ConvertedEmployee OR (Manual AND onboardingComplete: true)
    let employeeQuery = { $and: [] };
    
    if (empType && empType !== "All") {
      // If filtering by New/Old, manual employees (-) should NOT be included
      employeeQuery.$and.push({ userId: { $in: convertedUserIds } });
    } else {
      employeeQuery.$and.push({
        $or: [
          { userId: { $in: convertedUserIds } },
          { 
            userId: { $nin: paidUserIds }, 
            onboardingComplete: true 
          }
        ]
      });
    }
    const cleanStateName = (s) => (s || "").split('/')[0].trim();

    if (search) {
      const User = mongoose.model("User");
      const matchedUsers = await User.find({ phone: { $regex: search, $options: "i" } }).select("_id");
      const matchedUserIds = matchedUsers.map(u => u._id);

      employeeQuery.$and = employeeQuery.$and || [];
      employeeQuery.$and.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { workingDistrict: { $regex: search, $options: "i" } },
          { userId: { $in: matchedUserIds } }
        ]
      });
    }

    if (filterType === "locked") {
      employeeQuery.isZoneLocked = true;
    } else if (filterType === "unlocked") {
      employeeQuery.isZoneLocked = false;
    }

    // === ZONE MANAGEMENT GLOBAL FILTERS ===
    // Role filter: DM, BS, PE
    if (role && role !== "all") {
      const roleUpper = role.toUpperCase();
      if (roleUpper === 'PE') {
        employeeQuery.role = 'PE';
        employeeQuery.designation = { $not: /Block Supervisor/i };
      } else {
        employeeQuery.role = roleUpper;
      }
    }

    // State filter (Overridden for RM to their working state)
    const stateFilter = isRM ? loggedEmployee.workingState : state;
    if (stateFilter && stateFilter !== "all" && !isRM) {
      const stateClean = cleanStateName(stateFilter);
      const stateRegex = new RegExp(`^${stateClean}`, "i");
      employeeQuery.$and = employeeQuery.$and || [];
      employeeQuery.$and.push({
        $or: [
          { workingState: { $regex: stateRegex } },
          { state: { $regex: stateRegex } }
        ]
      });
    } else if (isRM && loggedEmployee) {
      const rmStateClean = cleanStateName(loggedEmployee.workingState);
      const stateRegex = new RegExp(`^${rmStateClean}`, "i");
      employeeQuery.$and = employeeQuery.$and || [];
      employeeQuery.$and.push({
        $or: [
          { workingState: { $regex: stateRegex } },
          { state: { $regex: stateRegex } }
        ]
      });
    }

    // ZC override for District
    if (isZC && loggedEmployee) {
      const zcDistricts = loggedEmployee.workingDistrict ? loggedEmployee.workingDistrict.split(",").map(d => d.split('/')[0].trim()) : [];
      if (zcDistricts.length > 0) {
        const orConditions = zcDistricts.map(d => {
          const regex = new RegExp(`^${d}`, "i");
          return {
            $or: [
              { workingDistrict: { $regex: regex } },
              {
                $and: [
                  { isZoneLocked: { $ne: true } },
                  { $or: [{ workingDistrict: null }, { workingDistrict: "" }] },
                  { district: { $regex: regex } }
                ]
              }
            ]
          };
        });
        employeeQuery.$and = employeeQuery.$and || [];
        employeeQuery.$and.push({ $or: orConditions });
      } else {
        employeeQuery._id = null; // No districts assigned
      }
    }

    // District filter
    if (district && district !== "all") {
      const distRegex = new RegExp(district, "i");
      employeeQuery.$and = employeeQuery.$and || [];
      employeeQuery.$and.push({
        $or: [
          { workingDistrict: { $regex: distRegex } },
          {
            $and: [
              { isZoneLocked: { $ne: true } },
              { $or: [{ workingDistrict: null }, { workingDistrict: "" }] },
              { district: { $regex: distRegex } }
            ]
          }
        ]
      });
    }

    // Block filter (match populated block name — need lookup via Block model)
    let blockIdFilter = null;
    if (block && block !== "all") {
      try {
        const Block = mongoose.models.Block || mongoose.model("Block");
        const matchedBlocks = await Block.find({ name: { $regex: new RegExp(block, "i") } }).select("_id");
        blockIdFilter = matchedBlocks.map(b => b._id);
        if (blockIdFilter.length > 0) {
          employeeQuery.$and = employeeQuery.$and || [];
          employeeQuery.$and.push({
            $or: [
              { workingBlock: { $in: blockIdFilter } },
              { workingBlocks: { $in: blockIdFilter } }
            ]
          });
        }
      } catch (blockErr) {
        console.warn("Block filter error:", blockErr.message);
      }
    }

    // Panchayat filter (match populated panchayat name)
    if (panchayat && panchayat !== "all") {
      try {
        const Panchayat = mongoose.models.Panchayat || mongoose.model("Panchayat");
        const matchedPanchayats = await Panchayat.find({ name: { $regex: new RegExp(panchayat, "i") } }).select("_id");
        const panchayatIds = matchedPanchayats.map(p => p._id);
        if (panchayatIds.length > 0) {
          employeeQuery.$and = employeeQuery.$and || [];
          employeeQuery.$and.push({
            $or: [
              { workingPanchayat: { $in: panchayatIds } },
              { workingPanchayats: { $in: panchayatIds } }
            ]
          });
        }
      } catch (panchErr) {
        console.warn("Panchayat filter error:", panchErr.message);
      }
    }
    // === END ZONE MANAGEMENT FILTERS ===

    const total = await Employee.countDocuments(employeeQuery);

    // Now find the corresponding employees
    const employees = await Employee.find(employeeQuery)
      .populate("jobPostingId")
      .populate("workingBlock")
      .populate("workingBlocks")
      .populate("workingPanchayat")
      .populate("workingPanchayats")
      .populate("userId", "email phone role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Role counts for stats cards (filtered by same query minus role)
    const baseQuery = { ...employeeQuery };
    delete baseQuery.role;
    const [dmCount, bsCount, peCount] = await Promise.all([
      Employee.countDocuments({ ...baseQuery, role: "DM" }),
      Employee.countDocuments({ ...baseQuery, role: "BS" }),
      Employee.countDocuments({ ...baseQuery, role: "PE" })
    ]);

    const userIds = employees.map(emp => emp.userId && emp.userId._id ? emp.userId._id : null).filter(Boolean);
    const applications = await Application.find({
      createdBy: { $in: userIds }
    }).select("createdBy paymentStatus mouStatus paymentId mouPaymentId amount mouAmount mouPaidAt");

    const attempts = await Attempt.find({
      userId: { $in: userIds },
      mouStatus: "ConvertedEmployee"
    }).select("userId mouStatus createdAt updatedAt");

    // Map the application info to the employees
    const data = employees.map(emp => {
      const app = applications.find(a => a.createdBy.toString() === emp.userId?._id?.toString());
      const attempt = attempts.find(a => a.userId.toString() === emp.userId?._id?.toString());
      const empObj = emp.toObject();

      // Force consistent designations for promoted roles
      if (empObj.role === 'PM') empObj.designation = 'Project Manager ( PM )';
      else if (empObj.role === 'RM') empObj.designation = 'Regional Manager ( RM )';
      else if (empObj.role === 'ZC') empObj.designation = 'Zonal Coordinator';

      const targetDate = new Date('2026-07-01T00:00:00Z');
      
      let employeeType = "-";
      if (attempt && attempt.mouStatus === 'ConvertedEmployee') {
        const checkDate = (app && app.mouPaidAt) 
          ? new Date(app.mouPaidAt) 
          : (attempt.createdAt ? new Date(attempt.createdAt) : new Date(empObj.createdAt));
        employeeType = checkDate >= targetDate ? 'New' : 'Old';
      }

      return {
        ...empObj,
        employeeType,
        application: app ? {
          paymentStatus: app.paymentStatus,
          mouStatus: app.mouStatus,
          paymentId: app.paymentId,
          mouPaymentId: app.mouPaymentId,
          amount: app.amount,
          mouAmount: app.mouAmount,
          mouPaidAt: app.mouPaidAt
        } : null
      };
    });

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      roleCounts: { dm: dmCount, bs: bsCount, pe: peCount, total: await Employee.countDocuments({ isZoneLocked: true }) }
    });
  } catch (error) {
    console.error("Zone Eligible Employees Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

let isRebuilding = false;
let pendingRebuild = false;

async function rebuildGlobalHierarchy() {
  if (isRebuilding) {
    console.log("♻️ HIERARCHY REBUILD ALREADY IN PROGRESS, QUEUEING ANOTHER RUN...");
    pendingRebuild = true;
    return;
  }
  isRebuilding = true;
  try {
    do {
      pendingRebuild = false;
      await _rebuildGlobalHierarchy();
    } while (pendingRebuild);
  } finally {
    isRebuilding = false;
  }
}

// Helper function to rebuild global hierarchical reporting structure
async function _rebuildGlobalHierarchy() {
  console.log("♻️ REBUILDING GLOBAL HIERARCHY...");
  try {
    const employees = await Employee.find({ isZoneLocked: true }).populate("jobPostingId");

    // Normalize helper for robust state/district comparison
    const norm = (s) => {
      if (s == null || s === '') return '';
      const t = String(s).trim().toLowerCase();
      const primary = t.split('/')[0].trim();
      return primary.replace(/\s+/g, ' ');
    };

    // Reset all reportingTo
    for (const emp of employees) {
      emp.reportingTo = null;
    }

    // Classify by role
    const pms = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "PM" || post.includes("project manager");
    });

    const dms = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "DM" || post.includes("district manager");
    });

    const zcs = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "ZC" || post.includes("zonal coordinator");
    });

    const rms = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "RM" || post.includes("regional manager");
    });

    const bss = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "BS" || post.includes("block supervisor");
    });

    const pes = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "PE" || post.includes("panchayat executive");
    });

    // RM reports to PM (All RMs report to the single global PM, since PM is Pan India)
    const globalPM = pms[0];
    for (const rm of rms) {
      if (globalPM) rm.reportingTo = globalPM.userId;
    }

    // ZC reports to RM (or falls back to PM)
    for (const zc of zcs) {
      const myState = zc.workingState;
      const rm = rms.find(r => r.workingState && norm(r.workingState) === norm(myState));
      if (rm) {
        zc.reportingTo = rm.userId;
      } else {
        if (globalPM) zc.reportingTo = globalPM.userId;
      }
    }

    // DM reports to ZC or RM (or falls back to PM)
    for (const dm of dms) {
      const myDistrict = dm.workingDistrict;
      const zc = zcs.find(z => {
        if (!z.workingDistrict) return false;
        const zcDistricts = z.workingDistrict.split(',').map(d => norm(d));
        return zcDistricts.includes(norm(myDistrict));
      });
      if (zc) {
        dm.reportingTo = zc.userId;
      } else {
        const myState = dm.workingState;
        const rm = rms.find(r => r.workingState && norm(r.workingState) === norm(myState));
        if (rm) {
          dm.reportingTo = rm.userId;
        } else {
          if (globalPM) dm.reportingTo = globalPM.userId;
        }
      }
    }

    // BS reports to DM or ZC
    for (const bs of bss) {
      const myBlockId = bs.workingBlock ? bs.workingBlock.toString() : null;
      const myDistrict = bs.workingDistrict;

      const dm = dms.find(d => {
        if (!d.workingDistrict || norm(d.workingDistrict) !== norm(myDistrict)) return false;
        if (d.isAllBlocksAssigned) return true;
        if (d.workingBlocks && d.workingBlocks.some(bId => bId.toString() === myBlockId)) return true;
        return false;
      });

      if (dm) {
        bs.reportingTo = dm.userId;
      } else {
        const zc = zcs.find(z => {
          if (!z.workingDistrict) return false;
          const zcDistricts = z.workingDistrict.split(',').map(d => norm(d));
          return zcDistricts.includes(norm(myDistrict));
        });
        if (zc) bs.reportingTo = zc.userId;
      }
    }

    // PE reports to BS or DM
    for (const pe of pes) {
      const myPanchayatId = pe.workingPanchayat ? pe.workingPanchayat.toString() : null;
      const myBlockId = pe.workingBlock ? pe.workingBlock.toString() : null;
      const myDistrict = pe.workingDistrict;

      const bs = bss.find(b => {
        if (!b.workingBlock || b.workingBlock.toString() !== myBlockId) return false;
        if (b.isAllPanchayatsAssigned) return true;
        if (b.workingPanchayats && b.workingPanchayats.some(pId => pId.toString() === myPanchayatId)) return true;
        return false;
      });

      if (bs) {
        pe.reportingTo = bs.userId;
      } else {
        const dm = dms.find(d => {
          if (!d.workingDistrict || norm(d.workingDistrict) !== norm(myDistrict)) return false;
          if (d.isAllBlocksAssigned) return true;
          if (d.workingBlocks && d.workingBlocks.some(bId => bId.toString() === myBlockId)) return true;
          return false;
        });
        if (dm) pe.reportingTo = dm.userId;
      }
    }

    // Save all modified employee structures
    for (const emp of employees) {
      await Employee.updateOne({ _id: emp._id }, { $set: { reportingTo: emp.reportingTo } });
    }
    console.log("✅ GLOBAL HIERARCHY ALIGNMENT COMPLETE!");
  } catch (err) {
    console.error("❌ Failed to rebuild global hierarchy:", err);
  }
}

// @desc    Get status of all locked zones (used for dynamic double-assignment warnings)
// @route   GET /api/employees/assigned-zones-status
// @access  Admin / RM Only
router.get("/assigned-zones-status", authenticate, async (req, res) => {
  try {
    let isRM = false;
    let isZC = false;
    let loggedEmployee = null;

    if (req.user.role === 'employee') {
      loggedEmployee = await Employee.findOne({ userId: req.user.id });
      if (loggedEmployee) {
        if (loggedEmployee.role === 'RM') isRM = true;
        if (loggedEmployee.role === 'ZC') isZC = true;
      }
    }

    if (!['admin', 'superadmin', 'staff'].includes(req.user.role) && !isRM && !isZC) {
      return res.status(403).json({ error: "Access denied" });
    }

    let matchQuery = { isZoneLocked: true };
    if (isRM) {
      matchQuery.workingState = { $regex: new RegExp(`^${loggedEmployee.workingState}`, "i") };
    }
    if (isZC && loggedEmployee) {
      const zcDistricts = loggedEmployee.workingDistrict ? loggedEmployee.workingDistrict.split(",").map(d => d.split('/')[0].trim()) : [];
      if (zcDistricts.length > 0) {
        const orConditions = zcDistricts.map(d => ({ workingDistrict: { $regex: new RegExp(`^${d}`, "i") } }));
        matchQuery.$or = orConditions;
      } else {
        matchQuery._id = null;
      }
    }

    const assigned = await Employee.find(matchQuery)
      .select("name role workingState workingDistrict workingBlock workingBlocks workingPanchayat workingPanchayats isAllBlocksAssigned isAllPanchayatsAssigned")
      .populate("workingBlock", "name")
      .populate("workingBlocks", "name")
      .populate("workingPanchayat", "name")
      .populate("workingPanchayats", "name");

    res.json({ success: true, data: assigned });
  } catch (error) {
    console.error("Fetch Assigned Zones Status Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Assign zone to an employee (Admin panel / RM)
// @route   POST /api/employees/:id/assign-zone
// @access  Admin / RM Only
router.post("/:id/assign-zone", authenticate, async (req, res) => {
  try {
    let isRM = false;
    let isZC = false;
    let loggedEmployee = null;

    if (req.user.role === 'employee') {
      loggedEmployee = await Employee.findOne({ userId: req.user.id });
      if (loggedEmployee) {
        if (loggedEmployee.role === 'RM') isRM = true;
        if (loggedEmployee.role === 'ZC') isZC = true;
      }
    }

    if (!['admin', 'superadmin', 'staff'].includes(req.user.role) && !isRM && !isZC) {
      return res.status(403).json({ error: "Access denied" });
    }

    const employee = await Employee.findById(req.params.id).populate("jobPostingId");
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    // Geographically restrict RM assignments to their own workingState
    if (isRM && loggedEmployee) {
      const normalizeGeoState = (s) => (s || "").split('/')[0].trim().toLowerCase();
      const rmStateNorm = normalizeGeoState(loggedEmployee.workingState);
      const targetStateNorm = normalizeGeoState(employee.workingState || employee.state);
      if (rmStateNorm !== targetStateNorm) {
        return res.status(403).json({ error: "Access denied: You can only assign zones to employees in your state." });
      }
    }

    if (isZC && loggedEmployee) {
      const empWorkingDist = employee.workingDistrict || "";
      const empDist = employee.district || "";
      const zcDistricts = loggedEmployee.workingDistrict ? loggedEmployee.workingDistrict.split(",").map(d => d.trim()) : [];

      const isMatch = zcDistricts.some(d => {
        const regex = new RegExp(`^${d.split('/')[0].trim()}`, "i");
        return regex.test(empWorkingDist) || regex.test(empDist);
      });

      if (!isMatch) {
        return res.status(403).json({ error: "Access denied: You can only assign zones to employees in your assigned districts." });
      }
    }

    const {
      workingState,
      workingDistrict,
      workingBlock,
      workingBlocks,
      workingPanchayat,
      workingPanchayats,
      isAllBlocksAssigned,
      isAllPanchayatsAssigned
    } = req.body;

    // Additional safety: If RM performs the update, double check the new state matches the RM state
    if (isRM && loggedEmployee) {
      const normalizeGeoState = (s) => (s || "").split('/')[0].trim().toLowerCase();
      const rmStateNorm = normalizeGeoState(loggedEmployee.workingState);
      if (normalizeGeoState(workingState) !== rmStateNorm) {
        return res.status(400).json({ error: "Invalid state: You cannot assign employees to a state outside of your own." });
      }
    }

    if (isZC && loggedEmployee) {
      const normalizeGeoDist = (d) => (d || "").split('/')[0].trim();
      const targetDistNorm = normalizeGeoDist(workingDistrict);
      const zcDistricts = loggedEmployee.workingDistrict ? loggedEmployee.workingDistrict.split(",").map(d => d.trim().split('/')[0].trim()) : [];

      const isMatch = zcDistricts.some(d => {
        const regex = new RegExp(`^${d}`, "i");
        return regex.test(targetDistNorm);
      });

      if (!isMatch) {
        return res.status(400).json({ error: "Invalid district: You cannot assign employees to a district outside of your own." });
      }
    }

    // Update fields
    employee.workingState = workingState || "";
    employee.workingDistrict = workingDistrict || "";
    employee.workingBlock = workingBlock || null;
    employee.workingBlocks = workingBlocks || [];
    employee.workingPanchayat = workingPanchayat || null;
    employee.workingPanchayats = workingPanchayats || [];
    employee.isAllBlocksAssigned = !!isAllBlocksAssigned;
    employee.isAllPanchayatsAssigned = !!isAllPanchayatsAssigned;
    employee.isZoneLocked = true;

    // Persist role / designation
    const myRole = (employee.role || "").toUpperCase();
    const myPost = (employee.jobPostingId?.post?.en || employee.designation || "").toLowerCase();
    employee.role = myRole || (myPost.includes('panchayat') ? 'PE' : myPost.includes('block') ? 'BS' : 'DM');
    employee.designation = employee.jobPostingId?.post?.en || employee.designation;

    await employee.save();

    // Rebuild global reporting structures to reconcile hierarchies asynchronously
    rebuildGlobalHierarchy().catch(err => console.error("Async hierarchy rebuild error:", err));

    res.json({
      success: true,
      message: "Zone assigned and hierarchy rebuilt successfully",
      data: employee
    });
  } catch (error) {
    console.error("Assign Zone Error:", error);
    res.status(500).json({ error: error.message || "Failed to assign zone" });
  }
});

// @desc    Admin bulk unlock zones
// @route   POST /api/employees/admin-bulk-unlock-zones
// @access  Admin / RM Only
router.post("/admin-bulk-unlock-zones", authenticate, async (req, res) => {
  try {
    let isRM = false;
    let isZC = false;
    let loggedEmployee = null;

    if (req.user.role === 'employee') {
      loggedEmployee = await Employee.findOne({ userId: req.user.id });
      if (loggedEmployee) {
        if (loggedEmployee.role === 'RM') isRM = true;
        if (loggedEmployee.role === 'ZC') isZC = true;
      }
    }

    if (!['admin', 'superadmin', 'staff'].includes(req.user.role) && !isRM && !isZC) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No employee IDs provided" });
    }

    // Find the employees
    const employees = await Employee.find({ _id: { $in: ids } });

    // Geographically restrict RM to their own workingState
    if (isRM && loggedEmployee) {
      const normalizeGeoState = (s) => (s || "").split('/')[0].trim().toLowerCase();
      const rmStateNorm = normalizeGeoState(loggedEmployee.workingState);
      const allInState = employees.every(emp => normalizeGeoState(emp.workingState || emp.state) === rmStateNorm);
      if (!allInState) {
        return res.status(403).json({ error: "Access denied: You can only unlock zones of employees in your state." });
      }
    }

    // Geographically restrict ZC to their assigned districts
    if (isZC && loggedEmployee) {
      const zcDistricts = loggedEmployee.workingDistrict ? loggedEmployee.workingDistrict.split(",").map(d => d.trim()) : [];
      const allInDistrict = employees.every(emp => {
        const empWorkingDist = emp.workingDistrict || "";
        const empDist = emp.district || "";
        return zcDistricts.some(d => {
          const regex = new RegExp(`^${d.split('/')[0].trim()}`, "i");
          return regex.test(empWorkingDist) || regex.test(empDist);
        });
      });
      if (!allInDistrict) {
        return res.status(403).json({ error: "Access denied: You can only unlock zones of employees in your assigned districts." });
      }
    }

    const userIds = employees.map(emp => emp.userId);

    // Free subordinates for all these employees
    await Employee.updateMany(
      { reportingTo: { $in: userIds } },
      { $set: { reportingTo: null } }
    );

    // Reset employee zones & managers in bulk
    await Employee.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          isZoneLocked: false,
          workingDistrict: "",
          workingBlock: null,
          workingPanchayat: null,
          reportingTo: null
        }
      }
    );

    res.json({ success: true, message: `Successfully unlocked ${ids.length} zones.` });
  } catch (error) {
    console.error("Admin Bulk Unlock Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Get all employees
// @route   GET /api/employees
// @access  Admin/Superadmin Only
router.get("/", authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const { search, role, state, district, block, panchayat } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    if (role && role !== 'all') {
      const roleUpper = role.toUpperCase();
      if (roleUpper === 'PE') {
        query.role = 'PE';
        query.designation = { $not: /Block Supervisor/i };
      } else {
        query.role = roleUpper;
      }
    }

    if (state && state !== 'all') {
      query.workingState = new RegExp(`^${state.split('/')[0].trim()}`, "i");
    }
    if (district && district !== 'all') {
      query.workingDistrict = new RegExp(`^${district}$`, "i");
    }

    // For block and panchayat, the frontend passes names but Employee stores ObjectIds.
    // However, it's complex to filter by names directly in find() without aggregation.
    // To support ManualEmployeeList filtering by name, we will look up the Block/Panchayat IDs first.
    if (block && block !== 'all') {
      const Block = mongoose.models.Block || mongoose.model("Block");
      const matchedBlocks = await Block.find({ name: new RegExp(`^${block}$`, "i") }).select('_id');
      if (matchedBlocks.length > 0) {
        query.workingBlock = { $in: matchedBlocks.map(b => b._id) };
      } else {
        query.workingBlock = null; // No match
      }
    }

    if (panchayat && panchayat !== 'all') {
      const Panchayat = mongoose.models.Panchayat || mongoose.model("Panchayat");
      const matchedPanchayats = await Panchayat.find({ name: new RegExp(`^${panchayat}$`, "i") }).select('_id');
      if (matchedPanchayats.length > 0) {
        query.workingPanchayat = { $in: matchedPanchayats.map(p => p._id) };
      } else {
        query.workingPanchayat = null; // No match
      }
    }

    // Exclude regular exam-flow employees who have paid their MOU fee
    const paidApps = await Application.find({ mouStatus: "paid" }).select("createdBy");
    const paidUserIds = paidApps.map(app => app.createdBy);
    query.userId = { $nin: paidUserIds };

    const total = await Employee.countDocuments(query);

    const employees = await Employee.find(query)
      .populate("jobPostingId")
      .populate("workingBlock")
      .populate("workingPanchayat")
      .populate("userId", "email phone role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: employees,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error("Get All Employees Error:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// @desc    Create manual employee
// @route   POST /api/employees
// @access  Admin/Superadmin Only
router.post("/", authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, fatherName, dob, jobPostingId, email, mobile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: mobile }]
    });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email or mobile already exists" });
    }

    // 1. Create User
    const hashedPassword = await bcrypt.hash("123456", 10); // Default password
    const user = await User.create({
      email: email.toLowerCase(),
      phone: mobile,
      password: hashedPassword,
      role: "employee",
      name: name, // Save name to User model
      isVerified: true
    });

    // 2. Create Employee
    const employee = await Employee.create({
      userId: user._id,
      name,
      fatherName,
      dob,
      jobPostingId,
      designation: "Manual Entry",
      onboardingComplete: false,
      status: "Active",
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee
    });
  } catch (error) {
    console.error("Create Employee Error:", error);
    res.status(500).json({ error: error.message || "Failed to create employee" });
  }
});

// @desc    Get single employee details with stats
// @route   GET /api/employees/:id/details
// @access  Admin/Staff Only
router.get("/:id/details", authenticate, async (req, res) => {
  try {
    if (!['admin', 'superadmin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const employee = await Employee.findById(req.params.id)
      .populate("jobPostingId")
      .populate("workingBlock")
      .populate("workingPanchayat")
      .populate("userId", "email phone role");

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Call shared detail query logic
    return fetchEmployeeStatsAndDetails(employee, req, res);
  } catch (error) {
    console.error("Get Employee Details Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Get single employee details with stats for RM Portal
// @route   GET /api/employees/:id/rm-details
// @access  RM/ZC Only
router.get("/:id/rm-details", authenticate, async (req, res) => {
  try {
    let isRM = false;
    let isZC = false;
    let loggedEmployee = null;

    if (req.user.role === 'employee') {
      loggedEmployee = await Employee.findOne({ userId: req.user.id });
      if (loggedEmployee) {
        if (loggedEmployee.role === 'RM') isRM = true;
        if (loggedEmployee.role === 'ZC') isZC = true;
      }
    }

    if (!isRM && !isZC) {
      return res.status(403).json({ error: "Access denied" });
    }

    const employee = await Employee.findById(req.params.id)
      .populate("jobPostingId")
      .populate("workingBlock")
      .populate("workingPanchayat")
      .populate("userId", "email phone role");

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Geographically restrict RM assignments to their own workingState
    if (isRM && loggedEmployee) {
      const normalizeGeoState = (s) => (s || "").split('/')[0].trim().toLowerCase();
      const rmStateNorm = normalizeGeoState(loggedEmployee.workingState);
      const targetStateNorm = normalizeGeoState(employee.workingState || employee.state);
      if (rmStateNorm !== targetStateNorm) {
        return res.status(403).json({ error: "Access denied: You can only view details of employees in your state." });
      }
    }

    if (isZC && loggedEmployee) {
      const empWorkingDist = employee.workingDistrict || "";
      const empDist = employee.district || "";
      const zcDistricts = loggedEmployee.workingDistrict ? loggedEmployee.workingDistrict.split(",").map(d => d.trim()) : [];

      const isMatch = zcDistricts.some(d => {
        const regex = new RegExp(`^${d.split('/')[0].trim()}`, "i");
        return regex.test(empWorkingDist) || regex.test(empDist);
      });

      if (!isMatch) {
        return res.status(403).json({ error: "Access denied: You can only view details of employees in your assigned districts." });
      }
    }

    // Call shared detail query logic
    return fetchEmployeeStatsAndDetails(employee, req, res);
  } catch (error) {
    console.error("Get RM Employee Details Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper for shared statistics extraction logic
async function fetchEmployeeStatsAndDetails(employee, req, res) {
  try {

    // 1. Get Card Count (Current Month and Lifetime)
    const Card = mongoose.model("Card");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [cardCount, monthlyCardCount] = await Promise.all([
      Card.countDocuments({ issuedBy: employee.userId }),
      Card.countDocuments({
        issuedBy: employee.userId,
        createdAt: { $gte: startOfMonth }
      })
    ]);

    // 2. Get Subordinate Stats & Jurisdiction
    let jurisdictionStats = {
      blocksCount: 0,
      panchayatsCount: 0
    };

    const role = (employee.role || "").toUpperCase();
    const designation = (employee.jobPostingId?.post?.en || employee.designation || "").toLowerCase();

    if (role === 'DM' || designation.includes('district manager')) {
      const Block = mongoose.model("Block");
      jurisdictionStats.blocksCount = await Block.countDocuments({ district: employee.workingDistrict });
      const Panchayat = mongoose.model("Panchayat");
      jurisdictionStats.panchayatsCount = await Panchayat.countDocuments({ district: employee.workingDistrict });
    } else if (role === 'BS' || designation.includes('block supervisor')) {
      const Panchayat = mongoose.model("Panchayat");
      jurisdictionStats.panchayatsCount = await Panchayat.countDocuments({ block: employee.workingBlock });
    }

    // 3. Get Financial Stats (Earnings, Withdrawals, Balance)
    const Transaction = mongoose.model("Transaction");
    const financialStats = await Transaction.aggregate([
      { $match: { userId: employee.userId, status: "SUCCESS" } },
      {
        $group: {
          _id: null,
          totalEarnings: {
            $sum: {
              $cond: [
                { $regexMatch: { input: "$type", regex: "^CREDIT_", options: "i" } },
                "$amount",
                0
              ]
            }
          },
          totalWithdrawals: {
            $sum: {
              $cond: [
                { $in: ["$type", ["DEBIT_SYSTEM", "DEBIT_WITHDRAWAL"]] },
                "$amount",
                0
              ]
            }
          }
        }
      }
    ]);

    const financials = financialStats[0] || { totalEarnings: 0, totalWithdrawals: 0 };

    // 4. Get Application & MOU Details
    const Application = mongoose.model("Application");
    let application = await Application.findOne({
      createdBy: employee.userId,
      mouStatus: "paid"
    }).populate("jobPostingId");

    if (!application) {
      application = await Application.findOne({
        createdBy: employee.userId,
        paymentStatus: "paid"
      }).sort({ createdAt: -1 }).populate("jobPostingId");
    }

    if (!application) {
      application = await Application.findOne({
        createdBy: employee.userId
      }).sort({ createdAt: -1 }).populate("jobPostingId");
    }

    // 5. Get Target Info from GoalConfig
    const GoalConfig = mongoose.model("GoalConfig");
    const goalConfig = await GoalConfig.findOne({ role: role });

    const targets = {
      monthly: goalConfig?.monthlyCardTarget || 0,
      achieved: monthlyCardCount,
      percentage: goalConfig?.monthlyCardTarget ? Math.min(100, Math.round((monthlyCardCount / goalConfig.monthlyCardTarget) * 100)) : 0
    };

    // 6. Get Review/Rating Summary
    const Review = mongoose.model("Review");
    const reviews = await Review.aggregate([
      { $match: { targetId: employee.userId, status: "Active" } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const ratingSummary = reviews[0] || { averageRating: 0, totalReviews: 0 };

    res.json({
      success: true,
      data: {
        ...employee.toObject(),
        stats: {
          cardCount,
          monthlyCardCount,
          ...jurisdictionStats
        },
        financials: {
          totalEarnings: financials.totalEarnings,
          totalWithdrawals: financials.totalWithdrawals,
          walletBalance: employee.walletBalance || 0,
          salaryBalance: employee.salaryWallet || 0
        },
        application: application,
        targets: targets,
        rating: ratingSummary
      }
    });
  } catch (error) {
    console.error("Get Employee Details Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// @desc    Update employee details
// @route   PATCH /api/employees/:id
// @access  Admin Only
router.patch("/:id", authenticate, async (req, res) => {
  try {
    if (!['admin', 'superadmin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const employeeId = req.params.id;
    const { designation, role, workingState, workingDistrict } = req.body;

    // --- DOUBLE-BOOKING PREVENTION FOR PM, RM & ZC ---
    if (role === 'PM') {
      const existing = await Employee.findOne({
        role: 'PM',
        _id: { $ne: employeeId }
      });
      if (existing) {
        return res.status(400).json({ error: "A Project Manager (PM) is already registered in the system. Only one Project Manager is allowed." });
      }
    }

    if (role === 'RM' || role === 'ZC') {
      let occupiedQuery = {
        isZoneLocked: true,
        _id: { $ne: employeeId }
      };

      if (role === 'RM' && workingState) {
        occupiedQuery.$or = [{ role: 'RM' }, { designation: { $regex: 'regional manager', $options: 'i' } }];
        occupiedQuery.workingState = workingState;

        const existing = await Employee.findOne(occupiedQuery);
        if (existing) {
          return res.status(400).json({ error: `State ${workingState} is already assigned to Regional Manager ${existing.name}.` });
        }
      } else if (role === 'ZC' && workingState) {
        occupiedQuery.$or = [{ role: 'ZC' }, { designation: { $regex: 'zonal coordinator', $options: 'i' } }];
        occupiedQuery.workingState = workingState;

        const existingZCs = await Employee.find(occupiedQuery);
        if (existingZCs.length > 0 && workingDistrict) {
          const selectedDistricts = workingDistrict.split(',').map(d => d.trim()).filter(Boolean);
          for (const zc of existingZCs) {
            if (zc.workingDistrict) {
              const zcDistricts = zc.workingDistrict.split(',').map(d => d.trim());
              const conflict = selectedDistricts.find(d => zcDistricts.includes(d));
              if (conflict) {
                return res.status(400).json({ error: `District ${conflict} is already assigned to Zonal Coordinator ${zc.name}.` });
              }
            }
          }
        }
      }
    }

    const updateData = {};
    if (designation) {
      updateData.designation = designation;

      // Find matching JobPosting using robust pattern matching
      const JobPosting = mongoose.model("JobPosting");
      let jpQuery = {};
      const lowerDest = designation.toLowerCase();

      if (lowerDest.includes("district manager") || role === "DM") {
        jpQuery = {
          $or: [
            { "post.en": { $regex: /District Manager/i } },
            { title: { $regex: /District Manager/i } }
          ]
        };
      } else if (lowerDest.includes("block supervisor") || role === "BS") {
        jpQuery = {
          $or: [
            { "post.en": { $regex: /Block Supervisor/i } },
            { title: { $regex: /Block Supervisor/i } }
          ]
        };
      } else if (lowerDest.includes("panchayat executive") || role === "PE") {
        jpQuery = {
          $or: [
            { "post.en": { $regex: /Panchayat Executive/i } },
            { title: { $regex: /Panchayat Executive/i } }
          ]
        };
      } else {
        jpQuery = {
          $or: [
            { "post.en": designation },
            { title: designation }
          ]
        };
      }

      const jobPosting = await JobPosting.findOne(jpQuery);

      if (jobPosting) {
        updateData.jobPostingId = jobPosting._id;

        // Also update their Application!
        const existingEmp = await Employee.findById(employeeId);
        if (existingEmp && existingEmp.userId) {
          const Application = mongoose.model("Application");
          await Application.updateMany(
            { createdBy: existingEmp.userId },
            { $set: { jobPostingId: jobPosting._id } }
          );
          console.log(`✅ [Correction Sync] Aligned applications for User ${existingEmp.userId} to JobPosting ${jobPosting._id} (${jobPosting.title || jobPosting.post?.en})`);
        }
      } else {
        console.warn(`⚠️ [Correction Sync] No matching JobPosting found for designation: "${designation}"`);
      }
    }
    if (role) {
      updateData.role = role;
      // Auto-lock zone for high-level management roles
      if (['RM', 'ZC'].includes(role) ||
        designation?.toLowerCase().includes('regional manager') ||
        designation?.toLowerCase().includes('zonal coordinator')) {
        updateData.isZoneLocked = true;
      }
    }
    if (workingState) updateData.workingState = workingState;
    if (workingDistrict) updateData.workingDistrict = workingDistrict;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error("Update Employee Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Update employee account status (Active / Inactive / Terminated)
// @route   PATCH /api/employees/:id/account-status
// @access  Admin / Superadmin / Staff
router.patch("/:id/account-status", authenticate, async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { action } = req.body;
    const allowed = ["activate", "deactivate", "terminate", "reactivate"];
    if (!allowed.includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    let employee = await Employee.findById(req.params.id);
    if (!employee && mongoose.Types.ObjectId.isValid(req.params.id)) {
      employee = await Employee.findOne({ userId: req.params.id });
    }
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (action === "activate" || action === "reactivate") {
      employee.status = "Active";
    } else if (action === "deactivate") {
      employee.status = "Inactive";
    } else if (action === "terminate") {
      employee.status = "Terminated";
    }

    await employee.save();

    res.json({
      success: true,
      message: `Employee marked as ${employee.status}`,
      data: { status: employee.status, _id: employee._id },
    });
  } catch (error) {
    console.error("Account Status Update Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Admin unlock or manage employee zone
// @route   POST /api/employees/:id/admin-manage-zone
// @access  Admin / RM Only
router.post("/:id/admin-manage-zone", authenticate, async (req, res) => {
  try {
    let isRM = false;
    let isZC = false;
    let loggedEmployee = null;

    if (req.user.role === 'employee') {
      loggedEmployee = await Employee.findOne({ userId: req.user.id });
      if (loggedEmployee) {
        if (loggedEmployee.role === 'RM') isRM = true;
        if (loggedEmployee.role === 'ZC') isZC = true;
      }
    }

    if (!['admin', 'superadmin', 'staff'].includes(req.user.role) && !isRM && !isZC) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { action } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // Enforce state restriction if RM is unlocking
    if (isRM && loggedEmployee) {
      const normalizeGeoState = (s) => (s || "").split('/')[0].trim().toLowerCase();
      const rmStateNorm = normalizeGeoState(loggedEmployee.workingState);
      const targetStateNorm = normalizeGeoState(employee.workingState || employee.state);
      if (rmStateNorm !== targetStateNorm) {
        return res.status(403).json({ error: "Access denied: You can only unlock zones of employees in your state." });
      }
    }

    // Enforce district restriction if ZC is unlocking
    if (isZC && loggedEmployee) {
      const empWorkingDist = employee.workingDistrict || "";
      const empDist = employee.district || "";
      const zcDistricts = loggedEmployee.workingDistrict ? loggedEmployee.workingDistrict.split(",").map(d => d.trim()) : [];

      const isMatch = zcDistricts.some(d => {
        const regex = new RegExp(`^${d.split('/')[0].trim()}`, "i");
        return regex.test(empWorkingDist) || regex.test(empDist);
      });

      if (!isMatch) {
        return res.status(403).json({ error: "Access denied: You can only unlock zones of employees in your assigned districts." });
      }
    }

    if (action === 'UNLOCK') {
      // Free subordinates so they can be claimed by the next person
      await Employee.updateMany(
        { reportingTo: employee.userId },
        { $set: { reportingTo: null } }
      );

      // Reset employee's zone & manager
      employee.isZoneLocked = false;
      employee.workingDistrict = "";
      employee.workingBlock = null;
      employee.workingPanchayat = null;
      employee.reportingTo = null;

      await employee.save();
      return res.json({ success: true, message: "Zone unlocked successfully", data: employee });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("Admin Manage Zone Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Delete manual employee
// @route   DELETE /api/employees/:id
// @access  Admin/Superadmin Only
router.delete("/:id", authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Free subordinates so they don't have an orphaned reportingTo reference
    if (employee.userId) {
      await Employee.updateMany(
        { reportingTo: employee.userId },
        { $set: { reportingTo: null } }
      );
    }

    // Delete associated User account
    if (employee.userId) {
      await User.findByIdAndDelete(employee.userId);
    }

    // Delete Employee document
    await Employee.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Employee and associated login account deleted successfully"
    });
  } catch (error) {
    console.error("Delete Employee Error:", error);
    res.status(500).json({ error: error.message || "Failed to delete employee" });
  }
});

export { rebuildGlobalHierarchy };
export default router;
