import express from "express";
import { body, validationResult } from "express-validator";
import Settings from "../models/Settings.js";
import { authenticate } from "../middleware/auth.js";
import { verifyRazorpayConfig, getRazorpayKeyId, verifyRazorpayCredentials } from "../utils/razorpay.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/settings
 * Get settings (admin only)
 */
router.get("/", async (req, res) => {
  try {
    // Only admin can view settings
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can view settings",
      });
    }

    const settings = await Settings.getSettings();

    // Verify Razorpay configuration
    const configStatus = await verifyRazorpayConfig();
    const currentKeyId = await getRazorpayKeyId();

    // Send credentials for admin (they can view their own credentials)
    const safeSettings = {
      razorpay: {
        keyId: settings.razorpay.keyId || "",
        keySecret: settings.razorpay.keySecret || "", // Show secret for admin
        isTestMode: settings.razorpay.isTestMode,
        testKeyId: settings.razorpay.testKeyId || "",
        testKeySecret: settings.razorpay.testKeySecret || "", // Show test secret for admin
        webhookSecret: settings.razorpay.webhookSecret || "", // Added field
        testWebhookSecret: settings.razorpay.testWebhookSecret || "", // Added field
        currentKeyId: currentKeyId, // Currently active key ID (test or live)
        configStatus: configStatus, // Configuration status
      },
      razorpayX: {
        keyId: settings.razorpayX?.keyId || "",
        keySecret: settings.razorpayX?.keySecret || "",
        isTestMode: settings.razorpayX?.isTestMode ?? true,
        testKeyId: settings.razorpayX?.testKeyId || "",
        testKeySecret: settings.razorpayX?.testKeySecret || "",
        accountNumber: settings.razorpayX?.accountNumber || "",
      },
      showSalaryBreakdown: settings.showSalaryBreakdown,
    };

    res.json({
      success: true,
      data: { settings: safeSettings },
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      error: "Failed to fetch settings",
      message: error.message,
    });
  }
});

/**
 * PUT /api/settings
 * Update settings (admin only)
 */
router.put(
  "/",
  [
    body("razorpay.keyId").optional().isString(),
    body("razorpay.keySecret").optional().isString(),
    body("razorpay.isTestMode").optional().isBoolean(),
    body("razorpay.testKeyId").optional().isString(),
    body("razorpay.testKeySecret").optional().isString(),
    body("razorpay.webhookSecret").optional().isString(),
    body("razorpay.testWebhookSecret").optional().isString(),
    body("showSalaryBreakdown").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      // Only admin can update settings
      if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can update settings",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings({});
      }

      // Update Razorpay settings
      if (req.body.razorpay) {
        if (req.body.razorpay.keyId !== undefined) {
          settings.razorpay.keyId = req.body.razorpay.keyId;
        }
        if (req.body.razorpay.keySecret !== undefined) {
          settings.razorpay.keySecret = req.body.razorpay.keySecret;
        }
        if (req.body.razorpay.isTestMode !== undefined) {
          settings.razorpay.isTestMode = req.body.razorpay.isTestMode;
        }
        if (req.body.razorpay.testKeyId !== undefined) {
          settings.razorpay.testKeyId = req.body.razorpay.testKeyId;
        }
        if (req.body.razorpay.testKeySecret !== undefined) {
          settings.razorpay.testKeySecret = req.body.razorpay.testKeySecret;
        }
        if (req.body.razorpay.webhookSecret !== undefined) {
          settings.razorpay.webhookSecret = req.body.razorpay.webhookSecret;
        }
        if (req.body.razorpay.testWebhookSecret !== undefined) {
          settings.razorpay.testWebhookSecret = req.body.razorpay.testWebhookSecret;
        }
      }

      // Update RazorpayX settings
      if (req.body.razorpayX) {
        if (!settings.razorpayX) settings.razorpayX = {};
        if (req.body.razorpayX.keyId !== undefined) {
          settings.razorpayX.keyId = req.body.razorpayX.keyId;
        }
        if (req.body.razorpayX.keySecret !== undefined) {
          settings.razorpayX.keySecret = req.body.razorpayX.keySecret;
        }
        if (req.body.razorpayX.isTestMode !== undefined) {
          settings.razorpayX.isTestMode = req.body.razorpayX.isTestMode;
        }
        if (req.body.razorpayX.testKeyId !== undefined) {
          settings.razorpayX.testKeyId = req.body.razorpayX.testKeyId;
        }
        if (req.body.razorpayX.testKeySecret !== undefined) {
          settings.razorpayX.testKeySecret = req.body.razorpayX.testKeySecret;
        }
        if (req.body.razorpayX.accountNumber !== undefined) {
          settings.razorpayX.accountNumber = req.body.razorpayX.accountNumber;
        }
      }

      if (req.body.showSalaryBreakdown !== undefined) {
        settings.showSalaryBreakdown = req.body.showSalaryBreakdown;
      }

      settings.updatedBy = req.user.id;
      await settings.save();

      // Verify updated configuration
      const configStatus = await verifyRazorpayConfig();
      const currentKeyId = await getRazorpayKeyId();

      res.json({
        success: true,
        message: "Settings updated successfully",
        data: {
          settings: {
            razorpay: {
              keyId: settings.razorpay.keyId,
              isTestMode: settings.razorpay.isTestMode,
              testKeyId: settings.razorpay.testKeyId,
              currentKeyId: currentKeyId, // Currently active key ID
              configStatus: configStatus, // Configuration status
            },
            razorpayX: {
              keyId: settings.razorpayX?.keyId,
              isTestMode: settings.razorpayX?.isTestMode,
              testKeyId: settings.razorpayX?.testKeyId,
              accountNumber: settings.razorpayX?.accountNumber,
            },
            showSalaryBreakdown: settings.showSalaryBreakdown,
          },
        },
      });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({
        error: "Failed to update settings",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/settings/razorpay/key
 * Get current Razorpay key ID (for frontend payment integration)
 * This endpoint can be accessed by authenticated users (not just admin)
 */
router.get("/razorpay/key", async (req, res) => {
  try {
    const keyId = await getRazorpayKeyId();
    const configStatus = await verifyRazorpayConfig();

    res.json({
      success: true,
      data: {
        keyId: keyId,
        isTestMode: configStatus.isTestMode,
        configured: configStatus.configured,
      },
    });
  } catch (error) {
    console.error("Get Razorpay key error:", error);
    res.status(500).json({
      error: "Failed to get Razorpay key",
      message: error.message,
    });
  }
});

/**
 * GET /api/settings/razorpay/status
 * Get Razorpay configuration status (admin only)
 */
router.get("/razorpay/status", async (req, res) => {
  try {
    // Only admin can view detailed status
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can view Razorpay status",
      });
    }

    const configStatus = await verifyRazorpayConfig();
    const currentKeyId = await getRazorpayKeyId();
    const settings = await Settings.getSettings();

    res.json({
      success: true,
      data: {
        configured: configStatus.configured,
        isTestMode: configStatus.isTestMode,
        hasKeyId: configStatus.hasKeyId,
        hasKeySecret: configStatus.hasKeySecret,
        currentKeyId: currentKeyId,
        testModeEnabled: settings.razorpay.isTestMode,
        liveKeyId: settings.razorpay.keyId || "",
        testKeyId: settings.razorpay.testKeyId || "",
      },
    });
  } catch (error) {
    console.error("Get Razorpay status error:", error);
    res.status(500).json({
      error: "Failed to get Razorpay status",
      message: error.message,
    });
  }
});

/**
 * POST /api/settings/razorpay/verify
 * Verify Razorpay credentials by making a test API call (admin only)
 */
router.post("/razorpay/verify", async (req, res) => {
  try {
    // Only admin can verify credentials
    if (!["admin", "superadmin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can verify Razorpay credentials",
      });
    }

    const verification = await verifyRazorpayCredentials();

    res.json({
      success: true,
      data: {
        valid: verification.valid,
        message: verification.message,
        mode: verification.mode,
        keyId: verification.keyId || null,
        error: verification.error || null,
      },
    });
  } catch (error) {
    console.error("Verify Razorpay credentials error:", error);
    res.status(500).json({
      error: "Failed to verify credentials",
      message: error.message,
    });
  }
});

export default router;
