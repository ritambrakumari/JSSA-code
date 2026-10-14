import express from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import Employee from "../models/Employee.js";
import GoalConfig from "../models/GoalConfig.js";
import Card from "../models/Card.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/zonal-tracking/admin/zcs
 * Get list of all Zonal Coordinators (Admin Only)
 */
router.get("/admin/zcs", async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { search } = req.query;
    
    // Find ZCs: either role is ZC or designation contains 'zonal coordinator'
    let matchQuery = { 
        $or: [
            { role: "ZC" },
            { designation: { $regex: /zonal coordinator/i } }
        ]
    };

    if (search) {
        const searchRegex = new RegExp(search, "i");
        const matchedUsers = await mongoose.model("User").find({ phone: { $regex: searchRegex } }).select("_id").lean();
        const matchedUserIds = matchedUsers.map(u => u._id);

        matchQuery = {
            $and: [
                matchQuery,
                {
                    $or: [
                        { name: { $regex: searchRegex } },
                        { userId: { $in: matchedUserIds } }
                    ]
                }
            ]
        };
    }

    const zcsRaw = await Employee.find(matchQuery)
      .populate("userId", "phone photo")
      .select("userId name role designation workingState workingDistrict photo isZoneLocked")
      .lean();

    // Map the phone from the populated user object to the employee object
    const zcs = zcsRaw.map(zc => ({
        ...zc,
        phone: zc.userId?.phone || null,
        photo: zc.photo || zc.userId?.photo || null,
        userId: zc.userId?._id || zc.userId // Ensure userId is just the ID if needed elsewhere
    }));

    res.json({ success: true, data: zcs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/zonal-tracking/admin/tracking-details/:zcId
 * Get tracking details for a specific ZC
 */
router.get("/admin/tracking-details/:zcId", async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const zcId = req.params.zcId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;
    
    // 1. Fetch ZC details
    const zcRaw = await Employee.findOne({ userId: zcId }).populate("userId", "phone photo").lean();
    if (!zcRaw) {
        return res.status(404).json({ success: false, message: "Zonal Coordinator not found" });
    }

    const zc = {
        ...zcRaw,
        phone: zcRaw.userId?.phone || null,
        photo: zcRaw.photo || zcRaw.userId?.photo || null,
        userId: zcRaw.userId?._id || zcRaw.userId
    };

    // Identify ZC's assigned districts
    const zcDistricts = zc.workingDistrict ? zc.workingDistrict.split(",").map(d => d.trim()).filter(Boolean) : [];
    
    // Configs
    const goalConfigs = await GoalConfig.find({});
    const configMap = {};
    goalConfigs.forEach(c => {
       configMap[c.role] = c.monthlyCardTarget || 0;
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // ZC Personal Matrix
    const zcTarget = configMap["ZC"] || 0;
    const zcCardsCount = await Card.countDocuments({
        issuedBy: zcId,
        createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });
    
    const zcMatrix = {
        target: zcTarget,
        achieved: zcCardsCount,
        percentage: zcTarget > 0 ? Math.min(Math.round((zcCardsCount / zcTarget) * 100), 100) : (zcCardsCount > 0 ? 100 : 0)
    };

    // 2. Fetch employees (DM, BS, PE) under ZC's assigned districts and locked zones
    let empMatch = { 
        role: { $in: ["DM", "BS", "PE"] },
        isZoneLocked: true
    };
    
    if (zcDistricts.length > 0) {
        empMatch.workingDistrict = { 
            $in: zcDistricts.map(d => {
                const baseName = d.split('/')[0].trim();
                const safeName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(`^${safeName}`, "i");
            }) 
        };
    } else {
        empMatch.workingDistrict = "___NONE___"; // fake
    }

    let searchEmpMatch = { ...empMatch };

    if (search) {
        const searchRegex = new RegExp(search, "i");
        // Phone is in User model, so find matched users first
        const matchedUsers = await mongoose.model("User").find({ phone: { $regex: searchRegex } }).select("_id").lean();
        const matchedUserIds = matchedUsers.map(u => u._id);

        searchEmpMatch.$or = [
            { name: { $regex: searchRegex } },
            { userId: { $in: matchedUserIds } }
        ];
    }

    // 1. Fetch ALL matching employees (without search) to get their IDs and Roles for the Overall Matrix
    const allEmployees = await Employee.find(empMatch).select("userId role").lean();
    const allUserIds = allEmployees.map(e => e.userId).filter(Boolean);
    
    // Get total count of searched employees for pagination
    const totalEmployees = await Employee.countDocuments(searchEmpMatch);

    // Get cards for all these employees to calculate Overall Matrix
    const overallCardCounts = await Card.aggregate([
      {
        $match: {
          issuedBy: { $in: allUserIds },
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

    const overallAchievedMap = {};
    overallCardCounts.forEach(c => {
      overallAchievedMap[c._id.toString()] = c.count;
    });

    let overallEmployeesTarget = 0;
    let overallEmployeesAchieved = 0;

    allEmployees.forEach(emp => {
      const empRole = emp.role ? emp.role.toUpperCase() : "PE";
      const target = configMap[empRole] || 0;
      const achieved = overallAchievedMap[emp.userId?.toString()] || 0;
      overallEmployeesTarget += target;
      overallEmployeesAchieved += achieved;
    });

    const overallMatrix = {
        target: overallEmployeesTarget,
        achieved: overallEmployeesAchieved,
        percentage: overallEmployeesTarget > 0 ? Math.min(Math.round((overallEmployeesAchieved / overallEmployeesTarget) * 100), 100) : (overallEmployeesAchieved > 0 ? 100 : 0)
    };

    // 2. Fetch paginated employees for the list view (with search)
    const paginatedEmployeesRaw = await Employee.find(searchEmpMatch)
      .populate("userId", "phone photo")
      .populate("workingBlock", "name")
      .populate("workingPanchayat", "name")
      .select("userId name role designation workingState workingDistrict workingBlock workingPanchayat photo isZoneLocked")
      .skip(skip)
      .limit(limit)
      .lean();

    const paginatedEmployees = paginatedEmployeesRaw.map(emp => ({
        ...emp,
        phone: emp.userId?.phone || null,
        photo: emp.photo || emp.userId?.photo || null,
        userId: emp.userId?._id || emp.userId
    }));

    const formattedEmployees = paginatedEmployees.map(emp => {
      const empRole = emp.role ? emp.role.toUpperCase() : "PE";
      const target = configMap[empRole] || 0;
      const achieved = overallAchievedMap[emp.userId?.toString()] || 0;

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
        percentage,
        colorCode,
        profilePicture: emp.profilePicture,
        isZoneLocked: emp.isZoneLocked || false
      };
    });

    const pagination = {
        total: totalEmployees,
        page: page,
        pages: Math.ceil(totalEmployees / limit)
    };

    res.json({ 
        success: true, 
        data: {
            zcDetails: zc,
            zcMatrix: zcMatrix,
            overallMatrix: overallMatrix,
            employees: formattedEmployees,
            pagination: pagination
        }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
