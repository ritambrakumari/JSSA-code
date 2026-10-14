import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import applicationsRoutes from "./routes/applications.js";
import jobPostingsRoutes from "./routes/jobPostings.js";
import studentsRoutes from "./routes/students.js";
import dashboardRoutes from "./routes/dashboard.js";
import settingsRoutes from "./routes/settings.js";
import galleryRoutes from "./routes/gallery.js";
import scrollerRoutes from "./routes/scroller.js";
import paymentsRoutes from "./routes/payments.js";
import notificationsRoutes from "./routes/notifications.js";
import noticesRoutes from "./routes/notices.js";
import uploadRoutes from "./routes/upload.js";
import questionBankRoutes from "./routes/questionBank.js";
import createPaperRoutes from "./routes/createPaper.js";
import testResultRoutes from "./routes/testResult.js";
import feeStructureRoutes from "./routes/feeStructure.js";
import mouRoutes from "./routes/mou.js";
import locationRoutes from "./routes/location.js";
import employeeRoutes from "./routes/employees.js";
import pharmaciesRoutes from "./routes/pharmacies.js";
import pharmacyCategoriesRoutes from "./routes/pharmacyCategories.js";
import pharmacyProductsRoutes from "./routes/pharmacyProducts.js";
import pharmacyBillsRoutes from "./routes/pharmacyBills.js";
import cardRoutes from "./routes/card.js";
import announcementRoutes from "./routes/announcements.js";
import claimsRoutes from "./routes/claims.js";
import walletRoutes from "./routes/wallet.js";
import payoutRoutes from "./routes/payout.js";
import goalConfigRoutes from "./routes/goalConfig.js";
import systemConfigRoutes from "./routes/systemConfig.js";
import jobRolesRoutes from "./routes/jobRoles.js";
import administrativeStaffRoutes from "./routes/administrativeStaff.js";
import refundsRoutes from "./routes/refunds.js";
import resignationsRoutes from "./routes/resignations.js";
import campsRoutes from "./routes/camps.js";
import feedRoutes from "./routes/feeds.js";
import leadRoutes from "./routes/leads.js";
import reviewRoutes from "./routes/reviews.js";
import withdrawalRoutes from "./routes/withdrawalRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import trainingRoutes from "./routes/training.js";
import calculatorRoutes from "./routes/calculator.js";
import qaRoutes from "./routes/qaRoutes.js";
import letterRoutes from "./routes/letters.js";
import visitorRoutes from "./routes/visitors.js";
import blogRoutes from "./routes/blogs.js";
import campReportRoutes from "./routes/campReport.js";
import policyRoutes from "./routes/policyRoutes.js";
import zonalTrackingRoutes from "./routes/zonalTracking.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import enquiryRoutes from "./routes/enquiries.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import customCertificateRoutes from "./routes/customCertificateRoutes.js";
import { connectDB } from "./config/database.js";
import { initScheduledSms, initClaimEscalationCron, initCertificateAutoAssignCron } from "./scheduler.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

// Trust proxy - essential for getting real client IP when behind Nginx/Load Balancer
app.set('trust proxy', true);

// Middleware
// CORS configuration - Allow domains from environment variables
const isDevelopment = process.env.NODE_ENV !== 'production';

const allowedOrigins = [
  // Localhost for development (common ports)
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:4173",
  "http://localhost:8080",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5174",
  // Parse CORS_ALLOWED_ORIGINS from .env (comma-separated)
  ...(process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : []
  ),
  // Legacy support for FRONTEND_URL
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  // Support for LANDING_URL (landing page URL)
  ...(process.env.LANDING_URL ? [process.env.LANDING_URL] : [])
];

app.use(cors({
  origin: function (origin, callback) {
    // In development, allow all localhost origins
    if (isDevelopment) {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Production convenience: allow our own domains (landing + dashboard) without env wiring
    // This prevents Razorpay authenticated routes from failing due to missing LANDING_URL/FRONTEND_URL.
    if (!isDevelopment) {
      try {
        const { hostname, protocol } = new URL(origin);
        const isHttp = protocol === "http:" || protocol === "https:";
        const isJssaDomain = hostname === "jssabhiyan.com" || hostname.endsWith(".jssabhiyan.com");
        if (isHttp && isJssaDomain) {
          return callback(null, true);
        }
      } catch (e) {
        // ignore parse errors; fall through to allowlist check
      }
    }

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log the blocked origin for debugging
      console.warn(`CORS blocked origin: ${origin}`);
      console.warn(`Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 hours
}));

// Set Permissions-Policy header to prevent accelerometer permission violations
// This suppresses warnings from third-party scripts trying to access accelerometer
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  next();
});
// Increase body parser limit to handle base64 images (10MB)
// Increase body parser limit to handle base64 images (10MB)
// Use verify function to capture raw body for webhook verification
app.use(express.json({
  limit: "10mb",
  strict: false,
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files statically with proper MIME types
const uploadsPath = path.join(__dirname, "uploads");

// Standard uploads route - serves images inline and other files as attachment
app.use("/uploads", express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png') || filePath.endsWith('.gif') || filePath.endsWith('.webp')) {
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Disposition', 'attachment; filename="' + path.basename(filePath) + '"');
    }
  }
}));

// Serve /api/uploads statically to match VITE_API_URL base paths
app.use("/api/uploads", express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png') || filePath.endsWith('.gif') || filePath.endsWith('.webp')) {
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Disposition', 'attachment; filename="' + path.basename(filePath) + '"');
    }
  }
}));

app.use("/api/files", express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Enable CORS for static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Set proper Content-Type for PDFs
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + path.basename(filePath) + '"');
    }
  }
}));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "JSSA Backend API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/job-postings", jobPostingsRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/scroller", scrollerRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/notices", noticesRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/question-bank", questionBankRoutes);
app.use("/api/create-paper", createPaperRoutes);
app.use("/api/test-result", testResultRoutes);
app.use("/api/fee-structure", feeStructureRoutes);
app.use("/api/mou", mouRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/pharmacies", pharmaciesRoutes);
app.use("/api/pharmacy-categories", pharmacyCategoriesRoutes);
app.use("/api/pharmacy-products", pharmacyProductsRoutes);
app.use("/api/pharmacy-bills", pharmacyBillsRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin/payout", payoutRoutes);
app.use("/api/goal-config", goalConfigRoutes);
app.use("/api/system-config", systemConfigRoutes);
app.use("/api/job-roles", jobRolesRoutes);
app.use("/api/administrative-staff", administrativeStaffRoutes);
app.use("/api/refunds", refundsRoutes);
app.use("/api/resignations", resignationsRoutes);
app.use("/api/camps", campsRoutes);
app.use("/api/feeds", feedRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/calculator", calculatorRoutes);
app.use("/api/qa", qaRoutes);
app.use("/api/letters", letterRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/camp-report", campReportRoutes);
app.use("/api/enquiries", enquiryRoutes);
import supportRoutes from "./routes/support.js";
import landingConfigRoutes from "./routes/landingConfigRoutes.js";
app.use("/api/support", supportRoutes);
app.use("/api/landing-config", landingConfigRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/zonal-tracking", zonalTrackingRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/custom-certificates", customCertificateRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error: Origin not allowed',
      message: `The origin ${req.headers.origin || 'unknown'} is not allowed by CORS policy.`,
      allowedOrigins: isDevelopment ? 'All localhost origins' : allowedOrigins
    });
  }

  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// Connect to Database
connectDB().then((success) => {
  if (success) {
    // Initialize scheduled tasks after DB connection
    initScheduledSms();
    initClaimEscalationCron();
    initCertificateAutoAssignCron();



    // Inspect and auto-promote specific employees to RM for test verification


    app.listen(PORT, () => {
      console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } else {
    console.error("❌ Critical: Server could not start because MongoDB connection failed.");
    console.error("Please check your .env file and MongoDB status.");
    process.exit(1);
  }
}).catch(err => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});
