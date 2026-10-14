import express from "express";
import { authenticate } from "../middleware/auth.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import Attempt from "../models/Attempt.js";
import crypto from "crypto";
import { getRazorpayInstance, getRazorpayKeyId, getRazorpayCredentials } from "../utils/razorpay.js";
import Employee from "../models/Employee.js";

const router = express.Router();

/**
 * POST /api/mou/submit
 * Save MOU details and create Razorpay order
 */
router.post("/submit", authenticate, async (req, res) => {
  try {
    const { applicationId, formData, amount } = req.body;

    if (!applicationId || !formData) {
      return res.status(400).json({ success: false, error: "Missing required data" });
    }

    // Update Application with MOU details
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    // Update fields
    application.wardNo = formData.wardNo;
    application.postOffice = formData.post;
    application.policeStation = formData.policeStation;
    application.handicapDisability = formData.handicapDisability;
    application.maritalStatus = formData.maritalStatus;
    application.languageKnown = formData.language;
    application.bloodGroup = formData.bloodGroup;
    application.accountHolderName = formData.accountHolderName;
    application.bankName = formData.bankName;
    application.accountNumber = formData.accountNumber;
    application.ifscCode = formData.ifscCode;
    application.branchName = formData.branchName;
    application.nomineeName = formData.nomineeName;
    application.nomineeRelation = formData.nomineeRelation;
    application.nomineeAge = formData.nomineeAge;
    application.nomineeAadhar = formData.nomineeAadhar;
    application.nomineeMobile = formData.nomineeMobile;
    application.nomineeEmail = formData.nomineeEmail;

    // Also update any fields that might have changed
    application.address = formData.villageTola;
    application.panchayat = formData.gramPanchayat;
    application.block = formData.blockKhand;
    application.district = formData.district;
    application.state = formData.state;
    application.country = formData.country;
    application.nationality = formData.nationality ? formData.nationality.toLowerCase() : "indian";
    application.motherName = formData.motherName;
    application.pan = formData.panNumber;
    application.pincode = formData.pincode;

    // Save document URLs
    application.aadharFront = formData.aadharFront;
    application.aadharBack = formData.aadharBack;
    application.panCard = formData.panCard;
    application.bankDoc = formData.bankDoc;

    // Sanitize education details: filter out invalid file values
    if (formData.educationDetails && Array.isArray(formData.educationDetails)) {
      application.educationDetails = formData.educationDetails.map(edu => ({
        level: edu.level || "",
        board: edu.board || "",
        year: edu.year || "",
        percentage: edu.percentage || "",
        file: typeof edu.file === 'string' ? edu.file : undefined
      }));
    }

    await application.save();

    // Create Razorpay Order
    const razorpay = await getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({ success: false, error: "Payment gateway not configured" });
    }

    const amountInPaise = Math.round(amount * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `mou_${applicationId.slice(-8)}_${Date.now()}`,
      notes: {
        applicationId,
        type: "mou_payment"
      }
    });

    application.mouOrderId = order.id;
    application.mouAmount = amount;
    await application.save();

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amountInPaise,
        keyId: await getRazorpayKeyId()
      }
    });

  } catch (error) {
    console.error("MOU submit error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/mou/verify
 * Verify Razorpay payment and upgrade user to employee
 */
router.post("/verify", authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId, testId } = req.body;

    const credentials = await getRazorpayCredentials();
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", credentials.keySecret)
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    // 1. Update Application
    const application = await Application.findById(applicationId).populate("jobPostingId");
    if (application) {
      application.mouStatus = "paid";
      application.mouPaymentId = razorpay_payment_id;
      if (!application.mouPaidAt) application.mouPaidAt = new Date();
      await application.save();
    }

    // 2. Update Attempt (mouStatus for Admin view)
    // We try to find the attempt by testId and userId
    const attempt = await Attempt.findOne({ applicationId: applicationId });
    if (attempt) {
      attempt.mouStatus = "Done";
      await attempt.save();
    }

    // 3. Upgrade User Role
    await User.findByIdAndUpdate(req.user.id, { role: "employee" });

    // 4. Generate & Save Employee ID
    if (application && !application.employeeId) {
      const postCodeMap = {
        "District Manager": "DM",
        "Block Supervisor": "BS",
        "Panchayat Executive": "PE",
        "Block Supervisor cum Panchayat Executive": "BS"
      };

      const stateCode = (application.state || "IN").substring(0, 2).toUpperCase();
      const postName = application.jobPostingId?.post?.en || application.post || "District Manager";
      const postCode = postCodeMap[postName] || "DM";
      const uniqueId = application._id.toString().slice(-6).toUpperCase();

      application.employeeId = `JSSA/${stateCode}/${postCode}/${uniqueId}`;
      await application.save();
    }

    // 5. Create or Update Employee Record (Migrate from Application)
    const existingEmployee = await Employee.findOne({ userId: req.user.id });
    const postCodeMap = {
      "District Manager": "DM",
      "Block Supervisor": "BS",
      "Panchayat Executive": "PE",
      "Block Supervisor cum Panchayat Executive": "BS"
    };

    const postName = application.jobPostingId?.post?.en || application.post || "District Manager";

    if (!existingEmployee && application) {
      await Employee.create({
        userId: req.user.id,
        name: application.candidateName,
        fatherName: application.fatherName,
        dob: application.dob,
        jobPostingId: application.jobPostingId._id,
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
        onboardingComplete: true, // IMPORTANT: Already filled in MOU
        status: "Active",
        createdBy: application.createdBy || req.user.id,
        role: postCodeMap[postName] || "DM",
        designation: postName
      });
      console.log(`✅ Employee record created for ${application.candidateName} via MOU flow.`);
    } else if (existingEmployee && application) {
      // Safely update existing record to reflect the newly paid vacancy and designation
      existingEmployee.jobPostingId = application.jobPostingId._id;
      existingEmployee.role = postCodeMap[postName] || "DM";
      existingEmployee.designation = postName;
      if (application.employeeId) {
        existingEmployee.employeeId = application.employeeId;
      }
      existingEmployee.villageTola = application.address;
      existingEmployee.gramPanchayat = application.panchayat;
      existingEmployee.blockKhand = application.block;
      existingEmployee.district = application.district;
      existingEmployee.state = application.state;
      existingEmployee.pincode = application.pincode;

      await existingEmployee.save();
      console.log(`✅ Employee record updated for ${application.candidateName} to ${postName} via MOU flow.`);
    }

    // 6. Credit Referral Bonus (Moved from Bulk Convert)
    if (application && application.referredBy) {
      try {
        const { default: SystemConfig } = await import("../models/SystemConfig.js");
        const { default: Transaction } = await import("../models/Transaction.js");
        const { default: Employee } = await import("../models/Employee.js");
        
        const sysConfig = await SystemConfig.findOne();
        const bonusAmount = sysConfig?.referralBonusAmount || 0;
        
        if (bonusAmount > 0) {
          const referringEmp = await Employee.findById(application.referredBy);
          if (referringEmp) {
            // Check if already credited for this application to avoid double credit
            const existingTx = await Transaction.findOne({
              employeeId: referringEmp._id,
              type: "CREDIT_COMMISSION",
              remarks: { $regex: new RegExp(`.*${application.candidateName}.*`, 'i') }
            });

            if (!existingTx) {
              await Transaction.create({
                userId: referringEmp.userId,
                employeeId: referringEmp._id,
                type: "CREDIT_COMMISSION",
                amount: bonusAmount,
                status: "SUCCESS",
                remarks: `Referral Bonus for hiring ${application.candidateName}`
              });
              
              referringEmp.salaryWallet = (referringEmp.salaryWallet || 0) + bonusAmount;
              referringEmp.totalEarnings = (referringEmp.totalEarnings || 0) + bonusAmount;
              await referringEmp.save();
              console.log(`✅ Credited referral bonus ₹${bonusAmount} to employee ${referringEmp._id} for referring ${application.candidateName}`);
            }
          }
        }
      } catch (err) {
        console.error("Failed to credit referral bonus:", err);
      }
    }

    res.json({
      success: true,
      message: "Payment verified. You are now an employee!"
    });

  } catch (error) {
    console.error("MOU verify error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/mou/mock-verify
 * Mock verification for development purposes ONLY
 * Saves all form data just like real verification
 */
router.post("/mock-verify", authenticate, async (req, res) => {
  try {
    // STRICT SECURITY CHECK: Only allow in development
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ success: false, error: "Mocking not allowed in production" });
    }

    const { applicationId, formData } = req.body;

    // 1. Update Application with MOU details (same as /submit)
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    // Update all form fields (matching /submit endpoint)
    if (formData) {
      application.wardNo = formData.wardNo;
      application.postOffice = formData.post;
      application.policeStation = formData.policeStation;
      application.handicapDisability = formData.handicapDisability;
      application.maritalStatus = formData.maritalStatus;
      application.languageKnown = formData.language;
      application.bloodGroup = formData.bloodGroup;
      application.accountHolderName = formData.accountHolderName;
      application.bankName = formData.bankName;
      application.accountNumber = formData.accountNumber;
      application.ifscCode = formData.ifscCode;
      application.branchName = formData.branchName;
      application.nomineeName = formData.nomineeName;
      application.nomineeRelation = formData.nomineeRelation;
      application.nomineeAge = formData.nomineeAge;
      application.nomineeAadhar = formData.nomineeAadhar;
      application.nomineeMobile = formData.nomineeMobile;
      application.nomineeEmail = formData.nomineeEmail;

      // Update address fields
      application.address = formData.villageTola;
      application.panchayat = formData.gramPanchayat;
      application.block = formData.blockKhand;
      application.district = formData.district;
      application.state = formData.state;
      application.country = formData.country;
      // Normalize nationality to lowercase enum
      application.nationality = formData.nationality ? formData.nationality.toLowerCase() : "indian";
      application.motherName = formData.motherName;
      application.pan = formData.panNumber;
      application.pincode = formData.pincode;

      // Save document URLs
      application.aadharFront = formData.aadharFront;
      application.aadharBack = formData.aadharBack;
      application.panCard = formData.panCard;
      application.bankDoc = formData.bankDoc;

      // Sanitize education details: filter out invalid file values
      if (formData.educationDetails && Array.isArray(formData.educationDetails)) {
        application.educationDetails = formData.educationDetails.map(edu => ({
          level: edu.level || "",
          board: edu.board || "",
          year: edu.year || "",
          percentage: edu.percentage || "",
          file: typeof edu.file === 'string' ? edu.file : undefined
        }));
      }
    }

    // Set payment status
    application.mouStatus = "paid";
    application.mouPaymentId = "mock_payment_" + Date.now();
    if (!application.mouPaidAt) application.mouPaidAt = new Date();
    await application.save();

    // 2. Update Attempt
    const attempt = await Attempt.findOne({ applicationId: applicationId });
    if (attempt) {
      attempt.mouStatus = "Done";
      await attempt.save();
    }

    // 3. Upgrade User Role
    await User.findByIdAndUpdate(req.user.id, { role: "employee" });

    // 4. Generate & Save Employee ID (For Preview/Testing)
    if (application && !application.employeeId) {
      const postCodeMap = {
        "District Manager": "DM",
        "Block Supervisor": "BS",
        "Panchayat Executive": "PE",
        "Block Supervisor cum Panchayat Executive": "BS"
      };

      const stateCode = (application.state || "IN").substring(0, 2).toUpperCase();
      const postName = application.jobPostingId?.post?.en || application.post || "District Manager";
      const postCode = postCodeMap[postName] || "DM";
      const uniqueId = application._id.toString().slice(-6).toUpperCase();

      application.employeeId = `JSSA/${stateCode}/${postCode}/${uniqueId}`;
      await application.save();
    }

    // 5. Create or Update Employee Record (Migrate from Application) - MOCK FLOW
    const existingEmployee = await Employee.findOne({ userId: req.user.id });
    const postCodeMap = {
      "District Manager": "DM",
      "Block Supervisor": "BS",
      "Panchayat Executive": "PE",
      "Block Supervisor cum Panchayat Executive": "BS"
    };

    const postName = application.jobPostingId?.post?.en || application.post || "District Manager";

    if (!existingEmployee && application) {
      await Employee.create({
        userId: req.user.id,
        name: application.candidateName,
        fatherName: application.fatherName,
        dob: application.dob,
        jobPostingId: application.jobPostingId._id,
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
        onboardingComplete: true, // IMPORTANT: Already filled in MOU
        status: "Active",
        createdBy: application.createdBy || req.user.id,
        role: postCodeMap[postName] || "DM",
        designation: postName
      });
      console.log(`✅ [MOCK] Employee record created for ${application.candidateName}.`);
    } else if (existingEmployee && application) {
      // Safely update existing record to reflect the newly paid vacancy and designation
      existingEmployee.jobPostingId = application.jobPostingId._id;
      existingEmployee.role = postCodeMap[postName] || "DM";
      existingEmployee.designation = postName;
      if (application.employeeId) {
        existingEmployee.employeeId = application.employeeId;
      }
      existingEmployee.villageTola = application.address;
      existingEmployee.gramPanchayat = application.panchayat;
      existingEmployee.blockKhand = application.block;
      existingEmployee.district = application.district;
      existingEmployee.state = application.state;
      existingEmployee.pincode = application.pincode;

      await existingEmployee.save();
      console.log(`✅ [MOCK] Employee record updated for ${application.candidateName} to ${postName}.`);
    }

    // 6. Credit Referral Bonus (Moved from Bulk Convert) - MOCK FLOW
    if (application && application.referredBy) {
      try {
        const { default: SystemConfig } = await import("../models/SystemConfig.js");
        const { default: Transaction } = await import("../models/Transaction.js");
        const { default: Employee } = await import("../models/Employee.js");
        
        const sysConfig = await SystemConfig.findOne();
        const bonusAmount = sysConfig?.referralBonusAmount || 0;
        
        if (bonusAmount > 0) {
          const referringEmp = await Employee.findById(application.referredBy);
          if (referringEmp) {
            // Check if already credited for this application to avoid double credit
            const existingTx = await Transaction.findOne({
              employeeId: referringEmp._id,
              type: "CREDIT_COMMISSION",
              remarks: { $regex: new RegExp(`.*${application.candidateName}.*`, 'i') }
            });

            if (!existingTx) {
              await Transaction.create({
                userId: referringEmp.userId,
                employeeId: referringEmp._id,
                type: "CREDIT_COMMISSION",
                amount: bonusAmount,
                status: "SUCCESS",
                remarks: `Referral Bonus for hiring ${application.candidateName} (Mock)`
              });
              
              referringEmp.salaryWallet = (referringEmp.salaryWallet || 0) + bonusAmount;
              referringEmp.totalEarnings = (referringEmp.totalEarnings || 0) + bonusAmount;
              await referringEmp.save();
              console.log(`✅ [MOCK] Credited referral bonus ₹${bonusAmount} to employee ${referringEmp._id} for referring ${application.candidateName}`);
            }
          }
        }
      } catch (err) {
        console.error("Failed to credit referral bonus in mock:", err);
      }
    }

    res.json({
      success: true,
      message: "MOCK: Payment verified. You are now an employee!"
    });

  } catch (error) {
    console.error("MOU mock verify error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
