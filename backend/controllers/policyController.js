import Policy from "../models/Policy.js";
import Employee from "../models/Employee.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads/policy directory exists
const policyDir = path.join(__dirname, "../uploads/policy");
if (!fs.existsSync(policyDir)) {
  fs.mkdirSync(policyDir, { recursive: true });
  console.log("✅ Created policy upload directory:", policyDir);
}

// Helper: build public file URL
const buildFileUrl = (req, filename) => {
  const protocol = req.protocol || "http";
  const host =
    req.get("host") ||
    process.env.BACKEND_URL ||
    `localhost:${process.env.PORT || 3006}`;
  return `${protocol}://${host}/api/files/policy/${filename}`;
};

// @desc    Get all policies
// @route   GET /api/policies
// @access  Private (Admin, Employee, CardHolder)
export const getPolicies = async (req, res) => {
  try {
    let userRole = (req.user?.role || "").toUpperCase();
    
    // If user is a generic 'employee', fetch their specific short role (PE, ZC, DM, etc.)
    if (userRole === "EMPLOYEE") {
      const employee = await Employee.findOne({ userId: req.user.id });
      if (employee && employee.role) {
        userRole = employee.role.toUpperCase();
      }
    }

    let query = {};
    
    // If not an admin/superadmin/staff, filter by visibility
    if (!["ADMIN", "SUPERADMIN", "STAFF"].includes(userRole)) {
      query = {
        $or: [
          { visibleTo: { $exists: false } }, // Legacy policies without the field
          { visibleTo: { $size: 0 } },       // Empty arrays
          { visibleTo: { $in: ["ALL", ""] } }, // handle empty string or ALL
          { visibleTo: { $in: [userRole] } }
        ]
      };
    }

    const policies = await Policy.find(query).sort({ createdAt: -1 }).populate("createdBy", "name email role");
    res.status(200).json({ success: true, data: policies });
  } catch (error) {
    console.error("Error fetching policies:", error);
    res.status(500).json({ success: false, message: "Server error while fetching policies" });
  }
};

// @desc    Upload multiple policies
// @route   POST /api/policies/upload
// @access  Private (Admin)
export const uploadPolicies = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files were uploaded" });
    }

    let metadata = [];
    try {
      metadata = JSON.parse(req.body.metadata);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid metadata" });
    }

    if (req.files.length !== metadata.length) {
      return res.status(400).json({ success: false, message: "Metadata length must match files length" });
    }

    const createdPolicies = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const meta = metadata[i];

      if (!meta.title) {
         return res.status(400).json({ success: false, message: "Title is required for all files" });
      }

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 12);
      const originalName = file.originalname || "policy";
      const ext = path.extname(originalName) || ".pdf";
      const filename = `policy_${timestamp}_${randomStr}${ext}`;
      const filepath = path.join(policyDir, filename);

      // Save file locally
      fs.writeFileSync(filepath, file.buffer);

      const fileType = file.mimetype === "application/pdf" ? "pdf" : "image";
      const fileUrl = buildFileUrl(req, filename);

      const policy = await Policy.create({
        title: meta.title.trim(),
        fileUrl,
        originalFileName: file.originalname,
        fileType,
        visibleTo: Array.isArray(meta.visibleTo) && meta.visibleTo.length > 0 ? meta.visibleTo : ["ALL"],
        createdBy: req.user.id, // Assumes authMiddleware attaches user.id to req
      });

      await policy.populate("createdBy", "name email");
      createdPolicies.push(policy);
    }

    res.status(201).json({ success: true, message: "Policies uploaded successfully", data: createdPolicies });
  } catch (error) {
    console.error("Error uploading policies:", error);
    res.status(500).json({ success: false, message: "Server error while uploading policies" });
  }
};

// @desc    Update policy details (e.g., name/title)
// @route   PUT /api/policies/:id
// @access  Private (Admin)
export const updatePolicy = async (req, res) => {
  try {
    const { title, visibleTo } = req.body;
    
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, message: "Policy not found" });
    }

    if (title) {
      policy.title = title.trim();
    }
    
    if (visibleTo) {
      let parsedVisibleTo = visibleTo;
      try {
        if (typeof visibleTo === 'string') parsedVisibleTo = JSON.parse(visibleTo);
      } catch (err) {}
      
      if (Array.isArray(parsedVisibleTo) && parsedVisibleTo.length > 0) {
        policy.visibleTo = parsedVisibleTo;
      } else {
        policy.visibleTo = ["ALL"];
      }
    }

    if (req.file) {
      // delete old file if it exists
      try {
        const urlParts = policy.fileUrl.split("/");
        const oldFilename = urlParts[urlParts.length - 1];
        const oldFilepath = path.join(policyDir, oldFilename);
        if (fs.existsSync(oldFilepath)) {
          fs.unlinkSync(oldFilepath);
          console.log("✅ Deleted old policy file:", oldFilename);
        }
      } catch (err) {
        console.error("Error deleting old file during update:", err);
      }

      // save new file
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 12);
      const originalName = req.file.originalname || "policy";
      const ext = path.extname(originalName) || ".pdf";
      const filename = `policy_${timestamp}_${randomStr}${ext}`;
      const filepath = path.join(policyDir, filename);

      fs.writeFileSync(filepath, req.file.buffer);

      policy.fileType = req.file.mimetype === "application/pdf" ? "pdf" : "image";
      policy.fileUrl = buildFileUrl(req, filename);
      policy.originalFileName = req.file.originalname;
    }
    
    const updatedPolicy = await policy.save();
    res.status(200).json({ success: true, data: updatedPolicy });
  } catch (error) {
    console.error("Error updating policy:", error);
    res.status(500).json({ success: false, message: "Server error while updating policy" });
  }
};

// @desc    Delete policy
// @route   DELETE /api/policies/:id
// @access  Private (Admin)
export const deletePolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ success: false, message: "Policy not found" });
    }

    // Extract filename from fileUrl and delete
    try {
      // url pattern: http://.../api/files/policy/filename.ext
      const urlParts = policy.fileUrl.split("/");
      const filename = urlParts[urlParts.length - 1];
      const filepath = path.join(policyDir, filename);
      
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log("✅ Deleted policy file:", filename);
      }
    } catch (fileError) {
      console.error("Error deleting policy file (continuing):", fileError);
    }

    await Policy.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Policy deleted successfully" });
  } catch (error) {
    console.error("Error deleting policy:", error);
    res.status(500).json({ success: false, message: "Server error while deleting policy" });
  }
};
