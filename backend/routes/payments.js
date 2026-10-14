import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth.js";
import crypto from "crypto";
import { getRazorpayInstance, getRazorpayKeyId, getRazorpayCredentials, getWebhookSecret } from "../utils/razorpay.js";
import JobPosting from "../models/JobPosting.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import Attempt from "../models/Attempt.js";
import { sendApplicationSuccessSMS } from "../utils/smsService.js";
import { verifyToken, extractToken } from "../utils/jwt.js";

const router = express.Router();

/**
 * POST /api/payments/webhook
 * Razorpay Webhook Handler
 * Used as a backup to ensure application is updated even if frontend fails
 */
router.post("/webhook", async (req, res) => {
  try {
    console.log("⚓ RAZORPAY WEBHOOK RECEIVED");

    const signature = req.headers["x-razorpay-signature"];
    const secret = await getWebhookSecret();

    if (!secret) {
      console.warn("⚠️ Webhook secret not configured. Skipping verification.");
      // It's safer to just log and skip if secret is not set yet, 
      // but in production, this should return 400.
    } else {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.rawBody || JSON.stringify(req.body))
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("❌ Invalid webhook signature detected.");
        return res.status(400).json({ error: "Invalid signature" });
      }
    }

    const { event, payload } = req.body;
    console.log(`📡 Razorpay Event: ${event}`);

    // Helper to find application by Order ID, Payment ID or Notes
    const findApplication = async () => {
      const orderId = payload.order?.entity?.id || payload.payment?.entity?.order_id;
      const notes = payload.order?.entity?.notes || payload.payment?.entity?.notes || payload.refund?.entity?.notes || {};
      const appIdFromNotes = notes.applicationId;

      console.log(`🔍 Webhook Debug: orderId=${orderId}, appIdFromNotes=${appIdFromNotes}`);

      // 1. Try finding by applicationId in notes (most robust)
      if (appIdFromNotes && appIdFromNotes !== "public" && appIdFromNotes !== "undefined") {
        try {
          const app = await Application.findById(appIdFromNotes);
          if (app) {
            console.log(`✅ Found Application by Notes ID: ${appIdFromNotes}`);
            return app;
          }
        } catch (e) {
          console.error("Error finding application by notes ID:", e);
        }
      }

      // 2. Try finding by Order ID
      if (orderId) {
        const app = await Application.findOne({ orderId });
        if (app) {
          console.log(`✅ Found Application by Order ID: ${orderId}`);
          return app;
        }
      }

      // 3. Try finding by Payment ID (for refunds)
      const paymentId = payload.refund?.entity?.payment_id || payload.payment?.entity?.id;
      if (paymentId) {
        const app = await Application.findOne({ paymentId });
        if (app) {
          console.log(`✅ Found Application by Payment ID: ${paymentId}`);
          return app;
        }
      }

      console.warn("❌ Could not find application by any method");
      return null;
    };

    const application = await findApplication();

    if (application) {
      const paymentNotes = payload.order?.entity?.notes || payload.payment?.entity?.notes || {};
      const isMouPayment = paymentNotes.type === "mou_payment";

      switch (event) {
        case "order.paid":
        case "payment.captured":
          if (isMouPayment) {
            if (application.mouStatus !== "paid") {
              const paymentId = payload.payment?.entity?.id || application.mouPaymentId;
              application.mouStatus = "paid";
              application.mouPaymentId = paymentId;
              if (!application.mouPaidAt) application.mouPaidAt = new Date();

              // Generate & Save Employee ID if not present
              if (!application.employeeId) {
                const postCodeMap = {
                  "District Manager": "DM",
                  "Block Supervisor": "BS",
                  "Panchayat Executive": "PE"
                };
                const stateCode = (application.state || "IN").substring(0, 2).toUpperCase();
                const postCode = postCodeMap[application.post] || "DM";
                const uniqueId = application._id.toString().slice(-6).toUpperCase();
                application.employeeId = `JSSA/${stateCode}/${postCode}/${uniqueId}`;
              }

              await application.save();
              console.log(`✅ MOU Paid: ${application.applicationNumber}`);

              // Update Attempt (mouStatus for Admin view)
              try {
                const attempt = await Attempt.findOne({ applicationId: application._id });
                if (attempt) {
                  attempt.mouStatus = "Done";
                  await attempt.save();
                }
              } catch (e) { console.error("Error updating attempt:", e); }

              // Upgrade User Role
              if (application.createdBy) {
                try {
                  await User.findByIdAndUpdate(application.createdBy, { role: "employee" });
                } catch (e) { console.error("Error updating user role:", e); }
              }
            }
          } else {
            if (application.paymentStatus !== "paid") {
              const paymentId = payload.payment?.entity?.id || application.paymentId;
              application.paymentStatus = "paid";
              application.paymentId = paymentId;
              application.paymentMethod = payload.payment?.entity?.method || application.paymentMethod;

              try {
                const jobPosting = await JobPosting.findById(application.jobPostingId);
                if (jobPosting) {
                  application.amount = calculateJobFee(jobPosting, application.gender, application.category);
                }
              } catch (e) { console.error("Amount calc error:", e); }

              await application.save();
              console.log(`✅ Paid: ${application.applicationNumber}`);

              if (application.mobile) {
                await sendApplicationSuccessSMS(application.mobile, application.applicationNumber).catch(console.error);
              }
            }
          }
          break;

        case "payment.failed":
          if (isMouPayment) {
            application.mouStatus = "failed";
            console.log(`❌ MOU Failed: ${application.applicationNumber}`);
          } else {
            application.paymentStatus = "failed";
            console.log(`❌ Failed: ${application.applicationNumber}`);
          }
          await application.save();
          break;

        case "refund.created":
          if (isMouPayment) {
            application.mouStatus = "refund processing";
            console.log(`⏳ MOU Refund Processing: ${application.applicationNumber}`);
          } else {
            application.paymentStatus = "refund processing";
            console.log(`⏳ Refund Processing: ${application.applicationNumber}`);
          }
          await application.save();
          break;

        case "refund.processed":
          if (isMouPayment) {
            application.mouStatus = "refunded";
            console.log(`💰 MOU Refunded: ${application.applicationNumber}`);
          } else {
            application.paymentStatus = "refunded";
            console.log(`💰 Refunded: ${application.applicationNumber}`);
          }
          await application.save();
          break;

        default:
          console.log(`ℹ️ Unhandled event: ${event}`);
      }
    } else {
      console.warn(`⚠️ No application found for event: ${event}`);
    }

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper to calculate fee from job posting, gender and category
const calculateJobFee = (jobPosting, gender, category) => {
  if (!jobPosting || !gender || !category) return 0;
  const feeKey = `${gender}_${category}`;
  const feeAmount = jobPosting.feeStructure?.[feeKey] || "0";
  return parseFloat(feeAmount.toString().replace(/[₹,]/g, "")) || 0;
};

/**
 * GET /api/payments/calculate-fee
 * Calculate fee for a job posting based on gender and category (PUBLIC)
 */
router.get("/calculate-fee", async (req, res) => {
  try {
    const { jobPostingId, gender, category } = req.query;

    if (!jobPostingId || !gender || !category) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "jobPostingId, gender, and category are required",
      });
    }

    // Get job posting
    const jobPosting = await JobPosting.findById(jobPostingId);
    if (!jobPosting) {
      return res.status(404).json({
        error: "Job posting not found",
      });
    }

    // Calculate fee
    const amountInRupees = calculateJobFee(jobPosting, gender, category);
    const feeKey = `${gender}_${category}`;

    res.json({
      success: true,
      data: {
        amount: amountInRupees,
        feeKey: feeKey,
        feeStructure: jobPosting.feeStructure,
      },
    });
  } catch (error) {
    console.error("Calculate fee error:", error);
    res.status(500).json({
      error: "Failed to calculate fee",
      message: error.message,
    });
  }
});

/**
 * POST /api/payments/create-order
 * Create Razorpay order for application fee payment
 * Supports both authenticated dashboard users and public landing applicants
 */
router.post(
  "/create-order",
  // Optional authentication - attach user if token is present, but do not fail when missing.
  async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = extractToken(authHeader);
        if (token) {
          const decoded = verifyToken(token);
          if (decoded) {
            req.user = { id: decoded.id, role: decoded.role };
          }
        }
      }
      next();
    } catch (err) {
      console.error("Auth middleware error in create-order:", err);
      // Continue as a public request if token is invalid/missing.
      next();
    }
  },
  [
    body("jobPostingId").notEmpty().withMessage("Job posting ID is required"),
    body("gender").isIn(["male", "female", "other"]).withMessage("Valid gender is required"),
    body("category").isIn(["general", "obc", "sc", "st", "ews"]).withMessage("Valid category is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { jobPostingId, gender, category, applicationId } = req.body;
      console.log(`📦 Creating Order: job=${jobPostingId}, user=${req.user?.id || "public"}, appId=${applicationId}`);

      // Smart lookup: If applicationId is missing but we have a logged-in user, 
      // try to find their most recent pending application for this job.
      let effectiveAppId = applicationId;
      if ((!effectiveAppId || effectiveAppId === "public") && req.user?.id) {
        try {
          const recentApp = await Application.findOne({
            jobPostingId: jobPostingId,
            createdBy: req.user.id,
            paymentStatus: "pending",
          }).sort({ createdAt: -1 });

          if (recentApp) {
            effectiveAppId = recentApp._id.toString();
            console.log(`🧠 Smart Auto-Linked Order to Application ${effectiveAppId}`);
          }
        } catch (err) {
          console.error("Smart lookup error:", err);
        }
      }

      // Get job posting
      const jobPosting = await JobPosting.findById(jobPostingId);
      if (!jobPosting) {
        return res.status(404).json({
          error: "Job posting not found",
        });
      }

      // Calculate fee based on gender and category
      const amountInRupees = calculateJobFee(jobPosting, gender, category);
      const amountInPaise = Math.round(amountInRupees * 100);
      const feeKey = `${gender}_${category}`;

      if (amountInPaise <= 0) {
        return res.status(400).json({
          error: "Invalid fee amount",
          message: "Fee amount is zero or invalid for this combination",
        });
      }

      // Get Razorpay instance
      const razorpay = await getRazorpayInstance();
      if (!razorpay) {
        return res.status(500).json({
          error: "Payment gateway not configured",
          message: "Razorpay credentials are not configured. Please contact administrator.",
        });
      }

      // Get Razorpay key ID for frontend
      const keyId = await getRazorpayKeyId();

      // Create order with shortened receipt (max 40 chars)
      const timestamp = Date.now().toString().slice(-10); // Last 10 digits
      const requesterIdShort = req.user?.id
        ? req.user.id.toString().slice(-8)
        : "public";
      const receipt = `app_${requesterIdShort}_${timestamp}`.substring(0, 40); // Ensure max 40 chars

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: receipt,
        notes: {
          jobPostingId: jobPostingId,
          applicationId: effectiveAppId || "", // Don't use "public" here, leave it empty if unknown
          userId: req.user?.id || "public",
          gender: gender,
          category: category,
        },
      });

      // If effectiveAppId is found, link it to this order immediately in the database
      if (effectiveAppId && effectiveAppId !== "public") {
        try {
          await Application.findByIdAndUpdate(effectiveAppId, {
            orderId: order.id,
          });
          console.log(`🔗 Successfully Linked Order ${order.id} to App ${effectiveAppId}`);
        } catch (linkError) {
          console.error("⚠️ Failed to link order to application:", linkError);
        }
      }

      res.json({
        success: true,
        data: {
          orderId: order.id,
          amount: amountInPaise,
          amountInRupees: amountInRupees,
          currency: "INR",
          keyId: keyId,
          feeKey: feeKey,
        },
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({
        error: "Failed to create payment order",
        message: error.message || "Payment gateway error",
      });
    }
  }
);

/**
 * POST /api/payments/verify
 * Verify Razorpay payment and update application
 * Supports both authenticated users and public applications (from landing page)
 * Authentication is optional - signature verification provides security
 */
router.post(
  "/verify",
  [
    body("razorpay_order_id").notEmpty().withMessage("Order ID is required"),
    body("razorpay_payment_id").notEmpty().withMessage("Payment ID is required"),
    body("razorpay_signature").notEmpty().withMessage("Signature is required"),
    body("applicationId").notEmpty().withMessage("Application ID is required"),
  ],
  // Optional authentication - try to authenticate but don't fail if no token
  async (req, res, next) => {
    try {
      // Try to authenticate if token is provided
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const { verifyToken, extractToken } = await import("../utils/jwt.js");
        const token = extractToken(authHeader);
        if (token) {
          const decoded = verifyToken(token);
          if (decoded) {
            req.user = { id: decoded.id, role: decoded.role };
          }
        }
      }
      next();
    } catch (err) {
      // Continue without authentication if token is invalid
      next();
    }
  },
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId } = req.body;

      // Get application
      const application = await Application.findById(applicationId);
      if (!application) {
        return res.status(404).json({
          error: "Application not found",
        });
      }

      // Verify ownership - allow if user is authenticated and owns the application
      // OR if no user is authenticated (public application from landing page)
      // The signature verification will ensure security
      if (req.user) {
        // If user is authenticated, verify ownership
        if (application.createdBy && application.createdBy.toString() !== req.user.id) {
          return res.status(403).json({
            error: "Access denied",
            message: "You can only verify payments for your own applications",
          });
        }
      }
      // If no user is authenticated (public application), proceed with signature verification only

      // Get Razorpay credentials for signature verification
      const credentials = await getRazorpayCredentials();

      // Verify signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac("sha256", credentials.keySecret)
        .update(text)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          error: "Payment verification failed",
          message: "Invalid payment signature",
        });
      }

      // Calculate fee to store in application
      const jobPosting = await JobPosting.findById(application.jobPostingId);
      const amount = calculateJobFee(jobPosting, application.gender, application.category);

      // Fetch payment details from Razorpay to get the method
      try {
        const razorpay = await getRazorpayInstance();
        if (razorpay) {
          const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
          if (paymentDetails && paymentDetails.method) {
            application.paymentMethod = paymentDetails.method;
          }
        }
      } catch (razorError) {
        console.error("⚠️ Error fetching payment details logic:", razorError);
      }

      // Update application with payment details
      application.paymentStatus = "paid";
      application.paymentId = razorpay_payment_id;
      application.orderId = razorpay_order_id;
      application.amount = amount;
      await application.save();

      console.log("✅ Payment status updated to 'paid' in database.");

      // Send payment success SMS
      console.log("📱 ========== APPLICATION SUCCESS SMS PROCESS START ==========");
      try {
        console.log("📱 Payment verified successfully. Triggering SMS...");
        console.log("📱 Application ID:", application._id);
        console.log("📱 Application No:", application.applicationNumber);
        console.log("📱 Mobile Number:", application.mobile);

        if (!application.mobile) {
          console.warn("⚠️ Application mobile number not found. Skipping SMS.");
        } else {
          try {
            const smsResult = await sendApplicationSuccessSMS(
              application.mobile,
              application.applicationNumber
            );

            if (smsResult && smsResult.success) {
              console.log("✅ Application success SMS sent successfully to:", application.mobile);
            } else {
              console.error("❌ Application success SMS failed:", smsResult?.error || "Unknown error");
              console.error("❌ SMS API Response:", JSON.stringify(smsResult));
            }
          } catch (smsErr) {
            console.error("❌ Exception while sending application success SMS:", smsErr);
          }
        }
      } catch (smsError) {
        console.error("❌ Error preparing application success SMS:", smsError);
      }

      res.json({
        success: true,
        message: "Payment verified successfully",
        data: {
          application: {
            id: application._id,
            paymentStatus: application.paymentStatus,
            paymentId: application.paymentId,
            orderId: application.orderId,
          },
        },
      });
    } catch (error) {
      console.error("Verify payment error:", error);
      res.status(500).json({
        error: "Failed to verify payment",
        message: error.message || "Payment verification error",
      });
    }
  }
);

/**
 * GET /api/payments/status
 * Get payment status by orderId and applicationId
 * Optional authentication
 */
router.get("/status", async (req, res) => {
  try {
    const { orderId, applicationId } = req.query;

    if (!orderId || !applicationId) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "orderId and applicationId are required",
      });
    }

    // Get application
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        error: "Application not found",
      });
    }

    res.json({
      success: true,
      data: {
        paymentStatus: application.paymentStatus || "pending",
        paymentId: application.paymentId || null,
        orderId: application.orderId || orderId,
      },
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({
      error: "Failed to get payment status",
      message: error.message || "Payment status error",
    });
  }
});

/**
 * GET /api/payments/transactions
 * Get transaction history for the logged-in user (applicants only)
 */
router.get("/transactions", authenticate, async (req, res) => {

  try {
    const { id } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, search } = req.query;

    const query = { createdBy: id };

    if (status && status !== 'all') {
      query.paymentStatus = status.toLowerCase();
    }

    if (search) {
      query.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } },
        { paymentId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    // Find all applications by this user with pagination and filtering
    const totalCount = await Application.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const applications = await Application.find(query)
      .populate("jobPostingId", "advtNo post title feeStructure")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Format the response to look like transactions
    const transactions = [];

    applications.forEach((app) => {
      // 1. Regular Application Fee Transaction
      if (app.paymentStatus === 'paid') {
        let amount = app.amount || 0;
        if (amount === 0 && app.jobPostingId) {
          amount = calculateJobFee(app.jobPostingId, app.gender, app.category);
        }

        transactions.push({
          id: app._id,
          type: "Application Fee",
          applicationNumber: app.applicationNumber || "N/A",
          candidateName: app.candidateName || "N/A",
          jobTitle: app.jobPostingId?.post?.en || app.jobPostingId?.post || "General",
          amount: amount,
          paymentStatus: "paid",
          paymentId: app.paymentId || "N/A",
          date: app.createdAt,
        });
      }

      // 2. MOU / Security Fee Transaction (For Employees)
      if (app.mouStatus === 'paid') {
        transactions.push({
          id: app._id,
          type: "Security Fee / MOU",
          isMou: true,
          applicationNumber: app.applicationNumber || "N/A",
          candidateName: app.candidateName || "N/A",
          jobTitle: app.jobPostingId?.post?.en || app.jobPostingId?.post || "General",
          amount: app.mouAmount || 0,
          paymentStatus: "paid",
          paymentId: app.mouPaymentId || "N/A",
          date: app.updatedAt, // Use updatedAt for MOU payment date if possible
        });
      }
    });

    // Sort combined transactions by date
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit
        }
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      error: "Failed to fetch transaction history",
      message: error.message,
    });
  }
});

/**
 * GET /api/payments/all-transactions
 * Get all transactions for admin (includes MOU fees)
 */
router.get("/all-transactions", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status && status !== "all") {
      if (status.toLowerCase() === "fully_paid") {
        query.paymentStatus = "paid";
        query.mouStatus = "paid";
      } else {
        query.$or = [
          { paymentStatus: status.toLowerCase() },
          { mouStatus: status.toLowerCase() }
        ];
      }
    }

    if (search) {
      query.$or = [
        { applicationNumber: { $regex: search, $options: "i" } },
        { candidateName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { paymentId: { $regex: search, $options: "i" } },
        { mouPaymentId: { $regex: search, $options: "i" } },
        { orderId: { $regex: search, $options: "i" } },
        { mouOrderId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total counts for dashboard stats
    const [totalCount, totalAppFeePaid, totalMOUFeePaid, totalApplications] = await Promise.all([
      Application.countDocuments(query),
      Application.countDocuments({ paymentStatus: "paid" }),
      Application.countDocuments({ mouStatus: "paid" }),
      Application.countDocuments({})
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    const applications = await Application.find(query)
      .populate("jobPostingId", "post title advtNo")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const transactions = applications.map(app => ({
      id: app._id,
      applicationNumber: app.applicationNumber || "N/A",
      candidateName: app.candidateName || "N/A",
      mobile: app.mobile || "N/A",
      email: app.email || "N/A",
      district: app.district || "N/A",
      state: app.state || "N/A",
      jobTitle: app.jobPostingId?.post?.en || app.jobPostingId?.title || "N/A",
      date: app.updatedAt,

      // Standard Application Fee
      appFee: {
        amount: (app.paymentStatus === "paid" && (!app.amount || app.amount === 0)) ? 260 : (app.amount || 0),
        status: app.paymentStatus || "pending",
        paymentId: app.paymentId || "N/A",
        orderId: app.orderId || "N/A",
        method: app.paymentMethod || "N/A",
      },

      // MOU Fee
      mouFee: {
        amount: app.mouAmount || 0,
        status: app.mouStatus || "pending",
        paymentId: app.mouPaymentId || "N/A",
        orderId: app.mouOrderId || "N/A",
      },

      // Overall highlight (if both paid, highlight success)
      isFullyPaid: app.paymentStatus === "paid" && app.mouStatus === "paid"
    }));

    res.json({
      success: true,
      data: {
        transactions,
        stats: {
          totalAppFeePaid,
          totalMOUFeePaid,
          totalApplications
        },
        pagination: {
          totalCount,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("All transactions error:", error);
    res.status(500).json({ error: "Failed to fetch all transactions", message: error.message });
  }
});

/**
 * PATCH /api/payments/mou/status
 * Manually update MOU payment status (Admin Only)
 */
router.patch("/mou/status", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const { applicationId, status, paymentId, amount } = req.body;
    if (!applicationId || !status) return res.status(400).json({ error: "Missing data" });

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ error: "Application not found" });

    application.mouStatus = status;
    if (paymentId) application.mouPaymentId = paymentId;
    if (amount) application.mouAmount = amount;

    await application.save();

    res.json({ success: true, message: "MOU status updated" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
