import Settings from "../models/Settings.js";

/**
 * Get Razorpay credentials based on test mode
 * @returns {Promise<{keyId: string, keySecret: string, isTestMode: boolean}>}
 */
export async function getRazorpayCredentials(forceTestMode = false) {
  try {
    const settings = await Settings.getSettings();
    const razorpay = settings.razorpay;
    // If test mode is enabled, or if forced to test mode, return test credentials
    if (razorpay.isTestMode || forceTestMode) {
      return {
        keyId: razorpay.testKeyId || "",
        keySecret: razorpay.testKeySecret || "",
        isTestMode: true,
      };
    }

    // Otherwise, return live credentials
    return {
      keyId: razorpay.keyId || "",
      keySecret: razorpay.keySecret || "",
      isTestMode: false,
    };
  } catch (error) {
    console.error("Error getting Razorpay credentials:", error);
    // Return empty credentials if there's an error
    return {
      keyId: "",
      keySecret: "",
      isTestMode: true,
    };
  }
}

/**
 * Get RazorpayX credentials based on test mode
 * @returns {Promise<{keyId: string, keySecret: string, isTestMode: boolean}>}
 */
export async function getRazorpayXCredentials(forceTestMode = false) {
  try {
    const settings = await Settings.getSettings();
    const razorpayX = settings.razorpayX;
    // If test mode is enabled, or if forced to test mode, return test credentials
    if (razorpayX?.isTestMode || forceTestMode) {
      return {
        keyId: razorpayX?.testKeyId || "",
        keySecret: razorpayX?.testKeySecret || "",
        isTestMode: true,
      };
    }

    // Otherwise, return live credentials
    return {
      keyId: razorpayX?.keyId || "",
      keySecret: razorpayX?.keySecret || "",
      isTestMode: false,
    };
  } catch (error) {
    console.error("Error getting RazorpayX credentials:", error);
    // Return empty credentials if there's an error
    return {
      keyId: "",
      keySecret: "",
      isTestMode: true,
    };
  }
}

/**
 * Get Razorpay webhook secret
 * @returns {Promise<string>}
 */
export async function getWebhookSecret() {
  try {
    const settings = await Settings.getSettings();
    const razorpay = settings.razorpay;

    // Use test webhook secret if test mode is enabled
    if (razorpay.isTestMode) {
      return razorpay.testWebhookSecret || "";
    }

    // Otherwise, return live webhook secret
    return razorpay.keySecret || "";
  } catch (error) {
    console.error("Error getting Razorpay webhook secret:", error);
    return "";
  }
}

/**
 * Get Razorpay key ID (for frontend use)
 * @returns {Promise<string>}
 */
export async function getRazorpayKeyId() {
  try {
    const credentials = await getRazorpayCredentials();
    return credentials.keyId;
  } catch (error) {
    console.error("Error getting Razorpay key ID:", error);
    return "";
  }
}

/**
 * Verify Razorpay credentials are configured
 * @returns {Promise<{configured: boolean, isTestMode: boolean, hasKeyId: boolean, hasKeySecret: boolean}>}
 */
export async function verifyRazorpayConfig() {
  try {
    const credentials = await getRazorpayCredentials();
    return {
      configured: !!(credentials.keyId && credentials.keySecret),
      isTestMode: credentials.isTestMode,
      hasKeyId: !!credentials.keyId,
      hasKeySecret: !!credentials.keySecret,
    };
  } catch (error) {
    console.error("Error verifying Razorpay config:", error);
    return {
      configured: false,
      isTestMode: true,
      hasKeyId: false,
      hasKeySecret: false,
    };
  }
}

/**
 * Initialize Razorpay instance (if razorpay package is installed)
 * @returns {Promise<Object|null>}
 */
export async function getRazorpayInstance() {
  try {
    // Check if razorpay package is available
    let Razorpay;
    try {
      Razorpay = (await import("razorpay")).default;
    } catch (err) {
      console.warn("Razorpay package not installed. Install with: npm install razorpay");
      return null;
    }

    const credentials = await getRazorpayCredentials();

    if (!credentials.keyId || !credentials.keySecret) {
      console.warn("Razorpay credentials not configured");
      return null;
    }

    return new Razorpay({
      key_id: credentials.keyId,
      key_secret: credentials.keySecret,
    });
  } catch (error) {
    console.error("Error initializing Razorpay:", error);
    return null;
  }
}

/**
 * Verify Razorpay credentials by making a test API call
 * @returns {Promise<{valid: boolean, message: string, mode: string}>}
 */
export async function verifyRazorpayCredentials() {
  try {
    const credentials = await getRazorpayCredentials();

    // Check if credentials are provided
    if (!credentials.keyId || !credentials.keySecret) {
      return {
        valid: false,
        message: "Credentials not configured. Please add Key ID and Key Secret.",
        mode: credentials.isTestMode ? "test" : "live",
      };
    }

    // Try to import razorpay package
    let Razorpay;
    try {
      Razorpay = (await import("razorpay")).default;
    } catch (err) {
      return {
        valid: false,
        message: "Razorpay package not installed. Install with: npm install razorpay",
        mode: credentials.isTestMode ? "test" : "live",
      };
    }

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: credentials.keyId,
      key_secret: credentials.keySecret,
    });

    // Make a test API call to verify credentials
    // Using orders API to verify credentials (simpler than payments)
    try {
      // Try to create a minimal test order (this will fail if credentials are invalid)
      // We'll use a very small amount for testing
      const testOrder = await razorpay.orders.create({
        amount: 100, // 1 rupee in paise
        currency: "INR",
        receipt: `test_${Date.now()}`,
      });

      // If order creation succeeds, credentials are valid
      return {
        valid: true,
        message: `Credentials are valid. ${credentials.isTestMode ? "Test" : "Live"} mode is active.`,
        mode: credentials.isTestMode ? "test" : "live",
        keyId: credentials.keyId,
      };
    } catch (apiError) {
      // Check if it's an authentication error
      if (apiError.statusCode === 401 || apiError.statusCode === 403) {
        return {
          valid: false,
          message: "Invalid credentials. Please check your Key ID and Key Secret.",
          mode: credentials.isTestMode ? "test" : "live",
          error: apiError.error?.description || apiError.message || "Authentication failed",
        };
      }

      // Check for other API errors
      if (apiError.error) {
        const errorCode = apiError.error.code;
        const errorDesc = apiError.error.description || apiError.message;

        // If it's a bad request but not auth error, credentials might be valid
        // but there's some other issue
        if (errorCode === "BAD_REQUEST_ERROR" && !errorDesc.toLowerCase().includes("auth")) {
          return {
            valid: true,
            message: `Credentials are valid. ${credentials.isTestMode ? "Test" : "Live"} mode is active.`,
            mode: credentials.isTestMode ? "test" : "live",
            keyId: credentials.keyId,
            warning: errorDesc,
          };
        }

        return {
          valid: false,
          message: `Verification failed: ${errorDesc}`,
          mode: credentials.isTestMode ? "test" : "live",
          error: errorDesc,
        };
      }

      throw apiError;
    }
  } catch (error) {
    console.error("Error verifying Razorpay credentials:", error);

    // Check error type
    if (error.statusCode === 401) {
      return {
        valid: false,
        message: "Invalid credentials. Authentication failed.",
        mode: "unknown",
        error: error.error?.description || error.message,
      };
    }

    return {
      valid: false,
      message: `Verification failed: ${error.message || "Unknown error"}`,
      mode: "unknown",
      error: error.error?.description || error.message,
    };
  }
}
