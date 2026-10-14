import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadPDF } from "../middleware/upload.js";
import Letter from "../models/Letter.js";
import Employee from "../models/Employee.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads/letters directory exists
const lettersDir = path.join(__dirname, "../uploads/letters");
if (!fs.existsSync(lettersDir)) {
  fs.mkdirSync(lettersDir, { recursive: true });
  console.log("✅ Created letters upload directory:", lettersDir);
}

// Helper: build public file URL
const buildFileUrl = (req, filename) => {
  const protocol = req.protocol || "http";
  const host =
    req.get("host") ||
    process.env.BACKEND_URL ||
    `localhost:${process.env.PORT || 3006}`;
  return `${protocol}://${host}/api/files/letters/${filename}`;
};

// Helper: normalize designation to canonical post for matching
const normalizePost = (val = "") => {
  const v = val.toLowerCase();
  if (v.includes("district manager")) return "District Manager";
  if (v.includes("block supervisor")) return "Block Supervisor";
  if (v.includes("panchayat executive")) return "Panchayat Executive";
  return null;
};

/**
 * @desc    Get all letters (Admin)
 * @route   GET /api/letters
 * @access  Admin Only
 */
router.get(
  "/",
  authenticate,
  authorize(["admin", "superadmin", "staff"]),
  async (req, res) => {
    try {
      const { state, district, block, panchayat, isEmployeeUpload } = req.query;
      const query = {};
      if (state) query.state = state;
      if (district) query.district = district;
      if (block) query.block = block;
      if (panchayat) query.panchayat = panchayat;
      if (isEmployeeUpload !== undefined) {
        if (isEmployeeUpload === "true") {
          query.isEmployeeUpload = true;
        } else {
          query.isEmployeeUpload = { $ne: true };
        }
      }

      const letters = await Letter.find(query)
        .populate("uploadedBy", "email name")
        .sort({ createdAt: -1 });

      res.json({ success: true, data: letters });
    } catch (error) {
      console.error("Get Letters Error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch letters" });
    }
  }
);

/**
 * @desc    Get letters for the logged-in employee (by their zone lock)
 * @route   GET /api/letters/my-letters
 * @access  Private (Employee)
 */
router.get("/my-letters", authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee || !employee.isZoneLocked) {
      return res.json({ success: true, data: [] });
    }

    const cleanState = employee.workingState ? employee.workingState.split(" / ")[0].trim() : "";
    const cleanDistrict = employee.workingDistrict ? employee.workingDistrict.split(" / ")[0].trim() : "";

    if (!cleanState) {
      return res.json({ success: true, data: [] });
    }

    const role = (employee.role || "").toUpperCase();
    
    // Fetch letters using $or based on hierarchy
    const orConditions = [];

    // Everyone can see State level letters for their state
    orConditions.push({ 
      state: cleanState, 
      district: { $in: [null, "", "ALL"] } 
    });

    if (role !== "STATE HEAD" && role !== "RM" && cleanDistrict) {
       // DM, BS, PE, ZC can see District level letters
       orConditions.push({
         state: cleanState,
         district: cleanDistrict,
         block: { $in: [null, "", "ALL"] }
       });
    }

    if (role !== "STATE HEAD" && role !== "RM" && role !== "DM" && role !== "ZC") {
      // BS, PE can see Block level letters
      const allowedBlocks = [];
      if (employee.workingBlock) allowedBlocks.push(employee.workingBlock.toString());
      if (employee.workingBlocks && employee.workingBlocks.length > 0) {
        allowedBlocks.push(...employee.workingBlocks.map(b => b.toString()));
      }
      
      if (allowedBlocks.length > 0) {
        orConditions.push({
          state: cleanState,
          district: cleanDistrict,
          block: { $in: allowedBlocks },
          panchayat: { $in: [null, "", "ALL"] }
        });
      }
      
      if (role === "PE") {
        // PE can see Panchayat level letters
        const allowedPanchayats = [];
        if (employee.workingPanchayat) allowedPanchayats.push(employee.workingPanchayat.toString());
        if (employee.workingPanchayats && employee.workingPanchayats.length > 0) {
          allowedPanchayats.push(...employee.workingPanchayats.map(p => p.toString()));
        }
        if (allowedPanchayats.length > 0) {
          orConditions.push({
            state: cleanState,
            district: cleanDistrict,
            block: { $in: allowedBlocks },
            panchayat: { $in: allowedPanchayats }
          });
        }
      }
    }

    // Finally, an employee can ALWAYS see their OWN uploads regardless of location rules
    orConditions.push({ uploadedBy: req.user.id });

    const query = { $or: orConditions };

    const letters = await Letter.find(query)
      .populate("uploadedBy", "name email role")
      .select("title state district block panchayat fileUrl fileType createdAt isEmployeeUpload letterLevel")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: letters });
  } catch (error) {
    console.error("Get My Letters Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch letters" });
  }
});

/**
 * @desc    Get team letters for RM and ZC
 * @route   GET /api/letters/team-letters
 * @access  Private (Employee - RM, ZC)
 */
router.get("/team-letters", authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee || !employee.isZoneLocked) {
      return res.json({ success: true, data: [] });
    }

    const role = (employee.role || "").toUpperCase();
    
    // Only RM and ZC can access team letters
    if (role !== "RM" && role !== "ZC") {
      return res.status(403).json({ success: false, error: "Access denied. Only RM and ZC can view team letters." });
    }

    const cleanState = employee.workingState ? employee.workingState.split(" / ")[0].trim() : "";
    if (!cleanState) {
      return res.json({ success: true, data: [] });
    }

    const query = {
      isEmployeeUpload: true,
      state: new RegExp(`^${cleanState}`, "i")
    };

    if (role === "ZC") {
      // ZC specific district filter
      const zcDistricts = employee.workingDistrict ? employee.workingDistrict.split(",").map(d => d.split('/')[0].trim()) : [];
      if (zcDistricts.length > 0) {
        const districtRegexes = zcDistricts.map(d => new RegExp(`^${d}`, "i"));
        query.district = { $in: districtRegexes };
      } else {
        return res.json({ success: true, data: [] });
      }
    }

    const letters = await Letter.find(query)
      .populate({
        path: "uploadedBy",
        select: "name email role",
        populate: {
          path: "employeeId",
          select: "role designation"
        }
      })
      .select("title state district block panchayat fileUrl fileType createdAt isEmployeeUpload letterLevel")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: letters });
  } catch (error) {
    console.error("Get Team Letters Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch team letters" });
  }
});

/**
 * @desc    Upload multiple letters (Admin)
 * @route   POST /api/letters
 * @access  Admin Only
 */
router.post(
  "/",
  authenticate,
  authorize(["admin", "superadmin", "staff"]),
  uploadPDF.array("files", 20),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: "Files are required" });
      }

      let metadata = [];
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (err) {
        return res.status(400).json({ success: false, error: "Invalid metadata" });
      }

      if (req.files.length !== metadata.length) {
        return res.status(400).json({ success: false, error: "Metadata length must match files length" });
      }

      const uploadedLetters = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const meta = metadata[i];

        if (!meta.title || !meta.state) {
           return res.status(400).json({ success: false, error: "Title and State are required" });
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 12);
        const originalName = file.originalname || "letter";
        const ext = path.extname(originalName) || ".pdf";
        const filename = `letter_${timestamp}_${randomStr}${ext}`;
        const filepath = path.join(lettersDir, filename);

        fs.writeFileSync(filepath, file.buffer);

        const fileType = file.mimetype === "application/pdf" ? "pdf" : "image";
        const fileUrl = buildFileUrl(req, filename);

        const letter = new Letter({
          title: meta.title.trim(),
          state: meta.state.trim(),
          district: meta.district ? meta.district.trim() : "",
          block: meta.block ? meta.block.trim() : "",
          blockName: meta.blockName ? meta.blockName.trim() : "",
          panchayat: meta.panchayat ? meta.panchayat.trim() : "",
          panchayatName: meta.panchayatName ? meta.panchayatName.trim() : "",
          fileUrl,
          filename,
          fileType,
          uploadedBy: req.user.id,
          letterLevel: meta.letterLevel || "Panchayat",
          isEmployeeUpload: false,
        });

        await letter.save();
        await letter.populate("uploadedBy", "email name");
        uploadedLetters.push(letter);
      }

      res.status(201).json({
        success: true,
        message: "Letters uploaded successfully",
        data: uploadedLetters,
      });
    } catch (error) {
      console.error("Upload Letter Error:", error);
      res.status(500).json({ success: false, error: "Failed to upload letters" });
    }
  }
);

/**
 * @desc    Upload letter (Employee)
 * @route   POST /api/letters/employee
 * @access  Private (Employee)
 */
router.post(
  "/employee",
  authenticate,
  uploadPDF.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "File is required" });
      }

      const employee = await Employee.findOne({ userId: req.user.id }).populate("workingBlock workingPanchayat");
      if (!employee) {
        return res.status(404).json({ success: false, error: "Employee not found" });
      }

      const title = req.body.title || "Employee Upload";

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 12);
      const originalName = req.file.originalname || "letter";
      const ext = path.extname(originalName) || ".pdf";
      const filename = `letter_emp_${timestamp}_${randomStr}${ext}`;
      const filepath = path.join(lettersDir, filename);

      fs.writeFileSync(filepath, req.file.buffer);

      const fileType = req.file.mimetype === "application/pdf" ? "pdf" : "image";
      const fileUrl = buildFileUrl(req, filename);

      const cleanState = employee.workingState ? employee.workingState.split(" / ")[0].trim() : "";
      const cleanDistrict = employee.workingDistrict ? employee.workingDistrict.split(" / ")[0].trim() : "";
      const blockId = employee.workingBlock ? employee.workingBlock._id.toString() : "";
      const blockName = employee.workingBlock ? employee.workingBlock.name : "";
      const panchayatId = employee.workingPanchayat ? employee.workingPanchayat._id.toString() : "";
      const panchayatName = employee.workingPanchayat ? employee.workingPanchayat.name : "";

      const letter = new Letter({
        title: title.trim(),
        state: cleanState,
        district: cleanDistrict,
        block: blockId,
        blockName: blockName,
        panchayat: panchayatId,
        panchayatName: panchayatName,
        fileUrl,
        filename,
        fileType,
        uploadedBy: req.user.id,
        isEmployeeUpload: true,
        letterLevel: "Employee"
      });

      await letter.save();
      await letter.populate("uploadedBy", "email name role");

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: letter,
      });
    } catch (error) {
      console.error("Employee Upload Letter Error:", error);
      res.status(500).json({ success: false, error: "Failed to upload document" });
    }
  }
);

/**
 * @desc    Delete a letter (Admin)
 * @route   DELETE /api/letters/:id
 * @access  Admin Only
 */
router.delete(
  "/:id",
  authenticate,
  authorize(["admin", "superadmin", "staff"]),
  async (req, res) => {
    try {
      const letter = await Letter.findById(req.params.id);
      if (!letter) {
        return res.status(404).json({ success: false, error: "Letter not found" });
      }

      // Delete file from local storage
      try {
        const filepath = path.join(lettersDir, letter.filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          console.log("✅ Deleted letter file:", letter.filename);
        }
      } catch (fileError) {
        console.error("Error deleting letter file (continuing):", fileError);
      }

      await Letter.findByIdAndDelete(req.params.id);

      res.json({ success: true, message: "Letter deleted successfully" });
    } catch (error) {
      console.error("Delete Letter Error:", error);
      res.status(500).json({ success: false, error: "Failed to delete letter" });
    }
  }
);

export default router;
