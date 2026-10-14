import express from "express";
import Doctor from "../models/Doctor.js";
import { authenticate } from "../middleware/auth.js";
import User from "../models/User.js";
import BroadcastJob from "../models/BroadcastJob.js";
import { sendSMS } from "../utils/smsService.js";
import bcrypt from "bcryptjs";
import { normalizePhone } from "../utils/validation.js";
import DoctorToken from "../models/DoctorToken.js";
import Prescription from "../models/Prescription.js";
import PharmacyNotification from "../models/PharmacyNotification.js";
import PharmacyProduct from "../models/PharmacyProduct.js";

// Helper function to send Doctor Consultation SMS
const sendDoctorConsultationSMS = async (phone) => {
  const templateId = '1107178281618196510';
  const message = `Dear Member, Welcome to JAN SWASTHYA SAHAYATA ABHIYAN. Your healthcare benefits are now available. Please log in to your account and take advantage of the Online Doctor Consultation service from the comfort of your home. Login now and access your health services anytime. -JAN SWASTHYA SAHAYTA ABHIYAN`;
  return await sendSMS(phone, message, templateId);
};

// Background Job Runner for Doctor Broadcast
const runDoctorBroadcastJob = async (jobId) => {
  try {
    const job = await BroadcastJob.findById(jobId);
    if (!job) return;

    await BroadcastJob.findByIdAndUpdate(jobId, { status: "processing" });

    const batchSize = 25; // Smaller batch size to prevent rate limiting
    let sent = 0;
    
    // Fetch actual users based on stored candidateIds
    const users = await User.find({ _id: { $in: job.candidateIds } }).select("phone");
    
    for (let i = 0; i < users.length; i += batchSize) {
      // Check if paused or cancelled
      let currentStatus = await BroadcastJob.findById(jobId).select("status");
      while (currentStatus && currentStatus.status === "paused") {
        await new Promise(resolve => setTimeout(resolve, 5000));
        currentStatus = await BroadcastJob.findById(jobId).select("status");
      }
      if (currentStatus && currentStatus.status === "cancelled") break;

      const batch = users.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (user) => {
          if (!user.phone || user.phone.length !== 10) return;
          try {
            await sendDoctorConsultationSMS(user.phone);
            sent++;
          } catch (e) {
            console.error(`SMS Failed for ${user.phone}:`, e.message);
          }
        })
      );

      await BroadcastJob.findByIdAndUpdate(jobId, { sentCount: sent });
      
      // Delay between batches to prevent spam/blocking
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    await BroadcastJob.findByIdAndUpdate(jobId, { status: "completed" });
  } catch (error) {
    console.error("Doctor Broadcast Error:", error);
    await BroadcastJob.findByIdAndUpdate(jobId, { status: "failed" });
  }
};

const router = express.Router();

// Get active (onboarded) doctors for cardholders
router.get("/active", authenticate, async (req, res) => {
  try {
    const doctors = await Doctor.find({ onboardingComplete: true }).select("-personalMobile -email");
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Token (Cardholder)
router.post("/:id/generate-token", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "cardHolder") {
      return res.status(403).json({ success: false, error: "Only cardholders can generate tokens" });
    }
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor || !doctor.onboardingComplete) {
      return res.status(404).json({ success: false, error: "Doctor not found or not onboarded yet" });
    }

    const { cardId } = req.body;

    // Check if cardholder already has a pending token for this specific doctor and card
    const query = { 
      cardholderId: req.user.id,
      doctorId: doctor._id,
      status: "pending" 
    };
    if (cardId) query.cardId = cardId;

    const existingPendingToken = await DoctorToken.findOne(query);
    if (existingPendingToken) {
      return res.status(400).json({ success: false, error: "You already have a pending consultation token for this doctor on this card." });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const tokenNumber = `JSSA-Doc-${randomNum}`;

    const newToken = new DoctorToken({
      doctorId: doctor._id,
      cardholderId: req.user.id,
      cardId: cardId || null,
      tokenNumber
    });

    await newToken.save();
    res.status(201).json({ success: true, token: newToken });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Tokens for Cardholder
router.get("/cardholder-tokens", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "cardHolder") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await DoctorToken.countDocuments({ cardholderId: req.user.id });
    const pages = Math.ceil(total / limit);

    const tokens = await DoctorToken.find({ cardholderId: req.user.id })
      .populate("doctorId", "name specification clinicName clinicAddress image signatureDoc")
      .populate("cardId", "cardholderName cardId gender")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json({ success: true, tokens, pagination: { total, pages, page } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get My Prescriptions (For Cardholder)
router.get("/prescriptions/my-prescriptions", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "cardHolder" && req.user.role !== "doctor") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    let query = {};
    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor) {
        return res.status(404).json({ success: false, error: "Doctor profile not found" });
      }
      query = { doctorId: doctor._id };
    } else {
      query = { cardholderId: req.user.id };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    if (search) {
      const matchingTokens = await DoctorToken.find({ tokenNumber: { $regex: search, $options: "i" } }).select('_id');
      const tokenIds = matchingTokens.map(t => t._id);
      query.tokenId = { $in: tokenIds };
    }

    const total = await Prescription.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const prescriptions = await Prescription.find(query)
      .populate("doctorId", "name specification clinicName clinicAddress image signatureDoc")
      .populate("pharmacyId", "businessName address mobile shopName name")
      .populate({
        path: "tokenId",
        select: "tokenNumber status cardId",
        populate: { path: "cardId", select: "cardholderName cardId gender" }
      })
      .populate("cardholderId", "name phone") // Just to have fallback cardholder data
      .populate({
        path: "medicines.medicineId",
        select: "name type unit pharmacyId",
        populate: { path: "pharmacyId", select: "businessName address mobile shopName name" }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, prescriptions, pagination: { total, pages, page } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Tokens for Doctor
router.get("/my-tokens", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor profile not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = { doctorId: doctor._id };
    if (search) {
      query.tokenNumber = { $regex: search, $options: "i" };
    }

    const total = await DoctorToken.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const tokens = await DoctorToken.find(query)
      .populate("cardholderId", "name phone")
      .populate("cardId", "cardholderName cardId gender")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, tokens, pagination: { total, pages, page } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Pending Tokens for Doctor (For Prescription)
router.get("/my-tokens/pending", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor profile not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = { doctorId: doctor._id, status: "pending" };
    if (search) {
      query.tokenNumber = { $regex: search, $options: "i" };
    }

    const total = await DoctorToken.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const tokens = await DoctorToken.find(query)
      .populate("cardholderId", "name phone age")
      .populate("cardId", "cardholderName cardId gender")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, tokens, pagination: { total, pages, page } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Prescription
router.post("/prescriptions/create", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor profile not found" });
    }

    const { tokenId, medicines, notes } = req.body;

    const token = await DoctorToken.findById(tokenId);
    if (!token || token.doctorId.toString() !== doctor._id.toString()) {
      return res.status(404).json({ success: false, error: "Token not found" });
    }
    if (token.status !== "pending") {
      return res.status(400).json({ success: false, error: "Token is not pending" });
    }

    // Fetch pharmacyId from the first medicine if it exists
    let pharmacyId = null;
    if (medicines && medicines.length > 0 && medicines[0].medicineId) {
      const product = await PharmacyProduct.findById(medicines[0].medicineId);
      if (product) {
        pharmacyId = product.pharmacyId;
      }
    }

    const prescription = new Prescription({
      tokenId: token._id,
      doctorId: doctor._id,
      cardholderId: token.cardholderId,
      pharmacyId,
      medicines,
      notes,
    });

    await prescription.save();

    // Update token status
    token.status = "prescribed";
    await token.save();

    // Create Notification for Pharmacy (Global for now, or you can assign to a specific pharmacy)
    await PharmacyNotification.create({
      prescriptionId: prescription._id,
      message: `New prescription added by Dr. ${doctor.name} for Token ${token.tokenNumber}`,
    });

    res.status(201).json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Token Status (Doctor)
router.put("/tokens/:tokenId/status", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    const { status } = req.body;
    if (!["pending", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    const token = await DoctorToken.findById(req.params.tokenId);
    if (!token) return res.status(404).json({ success: false, error: "Token not found" });

    token.status = status;
    await token.save();
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Doctor Profile (Self)
router.get("/me", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    const doctor = await Doctor.findOne({ userId: req.user.id }).populate("userId", "email phone");
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor not found" });
    }
    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit Onboarding (Doctor)
router.put("/onboarding", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    const updateData = req.body;
    updateData.onboardingComplete = true;
    updateData.status = 'inactive'; // Needs admin to assign them, or active if they are ready? The prompt says "After onboarding fill... doctor unka dashboard miljayega". But they shouldn't be active until they are assigned maybe? Let's keep it 'inactive' by default until assigned by admin. Actually, let's keep status 'active' so they can see their dashboard. The user said: "jb ona baording fill krrdega tb doctor unka dashbaord miljyega". The Admin assigns cardholders to them. So status 'active' or 'inactive' for session is different. Wait, status is for session (active/inactive) or global status? In DoctorSchema, status enum is ['pending', 'active', 'inactive']. Let's set it to 'inactive' which means they are boarded but not in an active session.

    updateData.status = 'inactive'; 

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor record not found" });
    }

    if (updateData.name) {
      await User.findByIdAndUpdate(req.user.id, { name: updateData.name });
    }

    res.json({ success: true, message: "Onboarding completed successfully", doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all doctors (Used by Admin)
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get inactive doctors (Used by Employee/Cardholder 'Doctor List' tab)
router.get("/inactive", async (req, res) => {
  try {
    const doctors = await Doctor.find({ 
      $or: [{ status: 'inactive' }, { status: { $exists: false } }] 
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get doctors for Employee
router.get("/employee", authenticate, async (req, res) => {
  try {
    const doctors = await Doctor.find({ 
      "assignedTo.employee": true,
      $or: [{ status: 'active' }, { status: { $exists: false } }]
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get doctors for Cardholder
router.get("/cardholder", authenticate, async (req, res) => {
  try {
    const doctors = await Doctor.find({ 
      "assignedTo.cardholder": true,
      $or: [{ status: 'active' }, { status: { $exists: false } }]
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all session histories
router.get("/session-history", authenticate, async (req, res) => {
  try {
    const doctors = await Doctor.find({ "sessionHistory.0": { $exists: true } });
    let history = [];
    
    doctors.forEach(doc => {
      doc.sessionHistory.forEach(session => {
        // Filter based on user role
        const role = req.user.role ? req.user.role.toLowerCase() : '';
        if (role === 'employee' && (!session.assignedTo || !session.assignedTo.employee)) return;
        if (role === 'cardholder' && (!session.assignedTo || !session.assignedTo.cardholder)) return;

        history.push({
          doctorId: doc._id,
          doctorName: doc.name,
          doctorImage: doc.image,
          specification: doc.specification,
          sessionId: session._id,
          startTime: session.startTime,
          endTime: session.endTime,
          youtubeLink: session.youtubeLink,
          gmeetLink: session.gmeetLink,
          assignedTo: session.assignedTo,
          isActive: !session.endTime
        });
      });
    });

    history.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single doctor
router.get("/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor not found" });
    }
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a doctor
router.post("/", authenticate, async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const { name, personalMobile, email, image, description, descriptionHi, bio, bioHi, specification, specificationHi, availabilityDate, availabilityTime, contactNumbers, assignedTo } = req.body;

    if (!name || !personalMobile) {
      return res.status(400).json({ success: false, error: "Name and Personal Mobile are required" });
    }

    const normalizedPhone = normalizePhone(personalMobile);
    const normalizedEmail = email ? email.toLowerCase() : null;

    // Check if user exists
    let existingUserQuery = [{ phone: normalizedPhone }];
    if (normalizedEmail) {
      existingUserQuery.push({ email: normalizedEmail });
    }

    const existingUser = await User.findOne({ $or: existingUserQuery });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "Mobile number or email already registered" });
    }

    // Create User with default password
    const hashedPassword = await bcrypt.hash(normalizedPhone, 10);
    const newUser = new User({
      name,
      phone: normalizedPhone,
      email: normalizedEmail,
      password: hashedPassword,
      role: "doctor"
    });

    const savedUser = await newUser.save();

    const newDoctor = new Doctor({
      userId: savedUser._id,
      personalMobile: normalizedPhone,
      email: normalizedEmail,
      name,
      image,
      description,
      descriptionHi,
      bio,
      bioHi,
      specification,
      specificationHi,
      availabilityDate,
      availabilityTime,
      contactNumbers,
      assignedTo,
      status: 'pending'
    });

    await newDoctor.save();
    res.status(201).json({ success: true, data: newDoctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Update a doctor (Edit numbers, assignments, etc.)
router.put("/:id", authenticate, async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor not found" });
    }

    // Avoid auto-setting status to inactive/active if it's pending (onboarding not complete)
    // Only if it's already active or inactive, we toggle. Or if explicitly passed.
    if (doctor.status !== 'pending' || req.body.status) {
      if (req.body.assignedTo && (req.body.assignedTo.employee || req.body.assignedTo.cardholder)) {
        req.body.status = 'active';
      } else if (req.body.assignedTo && (!req.body.assignedTo.employee && !req.body.assignedTo.cardholder)) {
        req.body.status = 'inactive';
      }
    }

    if (req.body.personalMobile) {
      req.body.personalMobile = normalizePhone(req.body.personalMobile);
    }
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
    }

    // Update User if needed
    if (doctor.userId && (req.body.name || req.body.personalMobile || req.body.email)) {
      const userUpdate = {};
      if (req.body.name) userUpdate.name = req.body.name;
      if (req.body.personalMobile) userUpdate.phone = req.body.personalMobile;
      if (req.body.email) userUpdate.email = req.body.email;
      
      // Check for duplicates if phone/email changed
      if (req.body.personalMobile && req.body.personalMobile !== doctor.personalMobile) {
         const existing = await User.findOne({ phone: req.body.personalMobile, _id: { $ne: doctor.userId } });
         if (existing) return res.status(400).json({ success: false, error: "Mobile number already registered" });
      }
      
      await User.findByIdAndUpdate(doctor.userId, userUpdate);
    }

    // Session History Logic
    if (req.body.status === 'active') {
      const activeSession = doctor.sessionHistory.find(s => !s.endTime);
      if (!activeSession) {
        doctor.sessionHistory.push({
          startTime: new Date(),
          youtubeLink: req.body.youtubeLink !== undefined ? req.body.youtubeLink : doctor.youtubeLink,
          gmeetLink: req.body.gmeetLink !== undefined ? req.body.gmeetLink : doctor.gmeetLink,
          assignedTo: req.body.assignedTo || doctor.assignedTo
        });
      } else {
        // Update current session
        if (req.body.youtubeLink !== undefined) activeSession.youtubeLink = req.body.youtubeLink;
        if (req.body.gmeetLink !== undefined) activeSession.gmeetLink = req.body.gmeetLink;
        if (req.body.assignedTo !== undefined) activeSession.assignedTo = req.body.assignedTo;
      }
    } else if (req.body.status === 'inactive') {
      const activeSession = doctor.sessionHistory.find(s => !s.endTime);
      if (activeSession) {
        activeSession.endTime = new Date();
      }
    }

    Object.assign(doctor, req.body);
    await doctor.save();
    const updatedDoctor = doctor;

    // Trigger SMS Broadcast if needed
    let broadcastJobId = null;
    let targetCount = 0;

    if (req.body.assignedTo && req.body.status === 'active') {
      const { employee, cardholder } = req.body.assignedTo;
      if (employee || cardholder) {
        let roles = [];
        if (employee) roles.push('employee');
        if (cardholder) roles.push('cardHolder');

        const users = await User.find({ role: { $in: roles } }).select('phone name');
        
        if (users.length > 0) {
          targetCount = users.length;
          const candidateIds = users.map(u => u._id);

          const job = await BroadcastJob.create({
            title: "Doctor Consultation SMS",
            jobType: "doctor_consult",
            totalCandidates: targetCount,
            sentCount: 0,
            status: "pending",
            candidateIds: candidateIds,
            channels: ["sms"],
            createdBy: req.user.id || req.user._id
          });
          
          broadcastJobId = job._id;
          
          // Start job asynchronously
          runDoctorBroadcastJob(job._id).catch(err => console.error("Doctor Job Error:", err));
        }
      }
    }

    res.json({ success: true, data: updatedDoctor, broadcastJobId, targetCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// End Session
router.post("/:id/end-session", authenticate, async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor not found" });
    }

    doctor.status = 'inactive';
    doctor.assignedTo = { cardholder: false, employee: false };
    
    const activeSession = doctor.sessionHistory.find(s => !s.endTime);
    if (activeSession) {
      activeSession.endTime = new Date();
    }

    await doctor.save();
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a doctor
router.delete("/:id", authenticate, async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const deletedDoctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!deletedDoctor) {
      return res.status(404).json({ success: false, error: "Doctor not found" });
    }
    res.json({ success: true, message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test SMS Endpoint
router.post("/test-sms", authenticate, async (req, res) => {
  try {
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const { phone } = req.body;
    if (!phone || phone.length !== 10) {
      return res.status(400).json({ success: false, error: "Valid 10 digit phone number is required" });
    }

    const result = await sendDoctorConsultationSMS(phone);
    if (result.success) {
      res.json({ success: true, message: "Test SMS sent successfully" });
    } else {
      res.status(500).json({ success: false, error: result.error || "Failed to send Test SMS" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
