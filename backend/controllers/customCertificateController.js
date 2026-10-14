import CustomCertificate from "../models/CustomCertificate.js";
import crypto from "crypto";

// @desc    Get all custom certificates
// @route   GET /api/custom-certificates
// @access  Private (Admin/Staff)
export const getAllCertificates = async (req, res) => {
  try {
    const certificates = await CustomCertificate.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: certificates.length, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Create new custom certificate
// @route   POST /api/custom-certificates
// @access  Private (Admin/Staff)
export const createCertificate = async (req, res) => {
  try {
    const { recipientName, position, eventName, location, issueDate, submittedBy, organizationName, customContent } = req.body;

    if (!recipientName || !position || !eventName || !location || !issueDate || !submittedBy) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    // Generate unique cert number
    const currentYear = new Date(issueDate).getFullYear();
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const certNumber = `JSSA/CUSTOM/${currentYear}/${randomSuffix.toUpperCase()}`;

    const newCert = await CustomCertificate.create({
      recipientName,
      position,
      eventName,
      location,
      issueDate: new Date(issueDate),
      submittedBy,
      organizationName: organizationName || "जन स्वास्थ्य सहायता अभियान (JSSA)",
      customContent: customContent || "",
      certNumber,
      createdBy: req.admin ? req.admin._id : null
    });

    res.status(201).json({ success: true, data: newCert });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Delete a custom certificate
// @route   DELETE /api/custom-certificates/:id
// @access  Private (Admin/Staff)
export const deleteCertificate = async (req, res) => {
  try {
    const cert = await CustomCertificate.findById(req.params.id);
    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    await cert.deleteOne();
    res.status(200).json({ success: true, message: "Certificate deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
