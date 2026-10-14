import express from "express";
import AdministrativeStaff from "../models/AdministrativeStaff.js";
import User from "../models/User.js";
import JobRole from "../models/JobRole.js";
import { authenticate, authorize } from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import { rebuildGlobalHierarchy } from "./employees.js";

const router = express.Router();

// @desc    Get all administrative staff
// @route   GET /api/administrative-staff
router.get("/", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const staff = await AdministrativeStaff.find()
      .populate("userId", "email phone role")
      .populate("jobRoleId")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error("Get Staff Error:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// @desc    Create new administrative staff
// @route   POST /api/administrative-staff
router.post("/", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const { 
      name, fatherName, dob, jobRoleId, email, mobile, password,
      salaryStructure, cardCommission 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { phone: mobile }] 
    });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email or mobile already exists" });
    }

    // 1. Create User
    const hashedPassword = await bcrypt.hash(password || "123456", 10);
    const user = await User.create({
      email: email.toLowerCase(),
      phone: mobile,
      password: hashedPassword,
      role: "staff",
      isVerified: true
    });

    // 2. Create Staff Record
    const staff = await AdministrativeStaff.create({
      userId: user._id,
      name,
      fatherName,
      dob,
      jobRoleId,
      status: "Active",
      salaryStructure,
      cardCommission,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, message: "Staff created successfully", data: staff });
  } catch (error) {
    console.error("Create Staff Error:", error);
    res.status(500).json({ error: error.message || "Failed to create staff" });
  }
});

// @desc    Get current staff profile
// @route   GET /api/administrative-staff/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const staff = await AdministrativeStaff.findOne({ userId: req.user.id })
      .populate("userId", "email phone")
      .populate("jobRoleId");
    
    if (!staff) {
      return res.status(404).json({ error: "Staff profile not found" });
    }

    const data = staff.toObject();
    if (staff.userId) {
      data.email = staff.userId.email;
      data.mobile = staff.userId.phone;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// @desc    Get staff onboarding status
// @route   GET /api/administrative-staff/onboarding-status
router.get("/onboarding-status", authenticate, async (req, res) => {
  try {
    const staff = await AdministrativeStaff.findOne({ userId: req.user.id });

    if (!staff) {
      return res.json({
        success: true,
        onboardingComplete: false,
        role: req.user.role,
        designation: "Staff"
      });
    }

    // Check completion steps
    const steps = {
      personalInfo: !!(staff.name && staff.fatherName && staff.dob),
      address: !!(staff.state && staff.district),
      documents: !!(staff.aadharFront && staff.photo && staff.signature),
      bankDetails: !!(staff.accountNumber && staff.ifscCode)
    };

    res.json({
      success: true,
      steps,
      onboardingComplete: staff.onboardingComplete || false,
      role: req.user.role,
      designation: "Staff"
    });
  } catch (error) {
    console.error("Staff Onboarding Status Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Complete staff onboarding
// @route   POST /api/administrative-staff/complete-onboarding
router.post("/complete-onboarding", authenticate, async (req, res) => {
  try {
    const staff = await AdministrativeStaff.findOne({ userId: req.user.id }).populate("jobRoleId");
    if (!staff) {
      return res.status(404).json({ error: "Staff profile not found" });
    }

    // Update fields from form
    const updateData = { ...req.body };
    updateData.onboardingComplete = true;

    // Check for Project Manager job role
    const jobTitle = staff.jobRoleId?.jobTitle || "";
    if (jobTitle.toLowerCase().includes("project manager")) {
      const workingState = updateData.state || staff.state;
      
      // Enforce global (system-wide) duplicate PM prevention
      const existingPM = await Employee.findOne({
        role: "PM",
        userId: { $ne: req.user.id }
      });
      if (existingPM) {
        return res.status(400).json({ error: "A Project Manager (PM) is already registered in the system. Only one Project Manager is allowed." });
      }

      // Upsert parallel Employee record
      await Employee.findOneAndUpdate(
        { userId: req.user.id },
        {
          userId: req.user.id,
          name: updateData.name || staff.name,
          fatherName: updateData.fatherName || staff.fatherName,
          dob: updateData.dob || staff.dob,
          role: "PM",
          designation: "Project Manager",
          workingState: workingState,
          workingDistrict: updateData.district || staff.district,
          onboardingComplete: true,
          isZoneLocked: true,
          createdBy: staff.createdBy || req.user.id
        },
        { upsert: true, new: true }
      );

      // Rebuild global hierarchical reporting structure
      await rebuildGlobalHierarchy();
    }

    await AdministrativeStaff.findByIdAndUpdate(staff._id, updateData, { new: true });

    // Sync name to User model if name was updated
    if (updateData.name) {
      await User.findByIdAndUpdate(req.user.id, { name: updateData.name });
    }

    res.json({ success: true, message: "Onboarding completed successfully" });
  } catch (error) {
    console.error("Complete Staff Onboarding Error:", error);
    res.status(500).json({ error: error.message || "Failed to complete onboarding" });
  }
});

// @desc    Delete staff member
// @route   DELETE /api/administrative-staff/:id
router.delete("/:id", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const staff = await AdministrativeStaff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: "Staff member not found" });

    // Delete User record too
    await User.findByIdAndDelete(staff.userId);
    await AdministrativeStaff.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Delete Staff Error:", error);
    res.status(500).json({ error: "Failed to delete staff" });
  }
});

// @desc    Get single staff member details
// @route   GET /api/administrative-staff/:id
router.get("/:id", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const staff = await AdministrativeStaff.findById(req.params.id)
      .populate("userId", "email phone role")
      .populate("jobRoleId");
    
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    res.json({ success: true, data: staff });
  } catch (error) {
    console.error("Get Staff Details Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Update staff member
// @route   PATCH /api/administrative-staff/:id
router.patch("/:id", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const { 
      name, fatherName, dob, jobRoleId, email, mobile, password,
      salaryStructure, cardCommission 
    } = req.body;

    const staff = await AdministrativeStaff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: "Staff member not found" });

    // Update User record if email/mobile/password changed
    const userUpdate = {};
    if (email) userUpdate.email = email.toLowerCase();
    if (mobile) userUpdate.phone = mobile;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      userUpdate.password = hashedPassword;
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(staff.userId, userUpdate);
    }

    // Update Staff Record
    const updatedStaff = await AdministrativeStaff.findByIdAndUpdate(
      req.params.id,
      {
        name,
        fatherName,
        dob,
        jobRoleId,
        salaryStructure,
        cardCommission
      },
      { new: true }
    ).populate("userId", "email phone role").populate("jobRoleId");

    // --- Fix for Project Manager Sync ---
    if (updatedStaff && updatedStaff.jobRoleId) {
      const newJobTitle = updatedStaff.jobRoleId.jobTitle || "";
      const isNowPM = newJobTitle.toLowerCase().includes("project manager") || newJobTitle.toLowerCase() === "pm";

      if (!isNowPM) {
        // Demotion / Role change: Delete parallel PM Employee record if it exists
        const existingEmployeeRecord = await Employee.findOne({ userId: staff.userId, role: "PM" });
        if (existingEmployeeRecord) {
          console.log(`[Auto-Sync] Demoting ${updatedStaff.name} from PM. Deleting parallel Employee record.`);
          await Employee.findByIdAndDelete(existingEmployeeRecord._id);
          
          // Unlink anyone reporting to them
          await Employee.updateMany({ reportingTo: staff.userId }, { $unset: { reportingTo: "" } });
          await rebuildGlobalHierarchy();
        }
      } else {
        // Upgrade / Remains PM: Ensure parallel PM Employee record exists
        const existingPM = await Employee.findOne({
          role: "PM",
          userId: { $ne: staff.userId }
        });
        if (!existingPM) {
          await Employee.findOneAndUpdate(
            { userId: staff.userId },
            {
              userId: staff.userId,
              name: updatedStaff.name,
              fatherName: updatedStaff.fatherName || "Father",
              dob: updatedStaff.dob || new Date("1990-01-01"),
              role: "PM",
              designation: "Project Manager",
              workingState: updatedStaff.state || "Gujarat",
              workingDistrict: updatedStaff.district || "Surendranagar",
              onboardingComplete: true,
              isZoneLocked: true,
              createdBy: req.user?.id || staff.createdBy
            },
            { upsert: true, new: true }
          );
          await rebuildGlobalHierarchy();
        }
      }
    }

    res.json({ success: true, message: "Staff updated successfully", data: updatedStaff });
  } catch (error) {
    console.error("Update Staff Error:", error);
    res.status(500).json({ error: error.message || "Failed to update staff" });
  }
});

// @desc    Update staff account status (Active/Inactive/Terminated)
// @route   PATCH /api/administrative-staff/:id/account-status
router.patch("/:id/account-status", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const { action } = req.body;
    const staff = await AdministrativeStaff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: "Staff member not found" });

    // Enforce Terminated state immutability from regular toggles
    if (staff.accountStatus === "Terminated" && action !== "reactivate") {
      return res.status(403).json({ error: "Cannot modify a terminated account directly. Must use reactivate." });
    }

    let newStatus = staff.accountStatus;
    let message = "";

    switch (action) {
      case "activate":
      case "reactivate":
        newStatus = "Active";
        message = action === "reactivate" ? "Account reactivated successfully" : "Account marked as Active";
        break;
      case "deactivate":
        newStatus = "Inactive";
        message = "Account marked as Inactive. Access revoked.";
        break;
      case "terminate":
        newStatus = "Terminated";
        message = "Account Terminated successfully. All access revoked permanently.";
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    const updatedStaff = await AdministrativeStaff.findByIdAndUpdate(
      req.params.id,
      { accountStatus: newStatus },
      { new: true }
    ).populate("userId", "email phone role").populate("jobRoleId");

    res.json({ success: true, message, data: updatedStaff });
  } catch (error) {
    console.error("Staff Account Status Update Error:", error);
    res.status(500).json({ error: "Failed to update account status" });
  }
});

export default router;

