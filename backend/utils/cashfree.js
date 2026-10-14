import Settings from "../models/Settings.js";

/**
 * Get Cashfree credentials
 * @returns {Promise<{appId: string, secretKey: string}>}
 */
export async function getCashfreeCredentials() {
  try {
    // First check environment variables (highest priority)
    const envAppId = process.env.CASHFREE_APP_ID;
    const envSecretKey = process.env.CASHFREE_SECRET_KEY;
    
    if (envAppId && envSecretKey) {
      return {
        appId: envAppId,
        secretKey: envSecretKey,
      };
    }

    // Fallback to database settings
    const settings = await Settings.getSettings();
    const cashfree = settings.cashfree;

    // Return credentials from database or environment variables
    return {
      appId: cashfree?.appId || process.env.CASHFREE_APP_ID || "",
      secretKey: cashfree?.secretKey || process.env.CASHFREE_SECRET_KEY || "",
    };
  } catch (error) {
    console.error("Error getting Cashfree credentials:", error);
    // Return credentials from environment variables only
    return {
      appId: process.env.CASHFREE_APP_ID || "",
      secretKey: process.env.CASHFREE_SECRET_KEY || "",
    };
  }
}

/**
 * Get Cashfree App ID (for frontend use)
 * @returns {Promise<string>}
 */
export async function getCashfreeAppId() {
  try {
    const credentials = await getCashfreeCredentials();
    return credentials.appId;
  } catch (error) {
    console.error("Error getting Cashfree App ID:", error);
    return process.env.CASHFREE_APP_ID || "";
  }
}

/**
 * Verify Cashfree credentials are configured
 * @returns {Promise<{configured: boolean, hasAppId: boolean, hasSecretKey: boolean}>}
 */
export async function verifyCashfreeConfig() {
  try {
    const credentials = await getCashfreeCredentials();
    return {
      configured: !!(credentials.appId && credentials.secretKey),
      hasAppId: !!credentials.appId,
      hasSecretKey: !!credentials.secretKey,
    };
  } catch (error) {
    console.error("Error verifying Cashfree config:", error);
    return {
      configured: false,
      hasAppId: false,
      hasSecretKey: false,
    };
  }
}

/**
 * Create Cashfree payment order
 * @param {Object} orderData - Order data
 * @param {number} orderData.amount - Amount in paise
 * @param {string} orderData.orderId - Unique order ID
 * @param {string} orderData.customerName - Customer name
 * @param {string} orderData.customerEmail - Customer email
 * @param {string} orderData.customerPhone - Customer phone
 * @param {Object} orderData.notes - Additional notes
 * @returns {Promise<Object>}
 */
export async function createCashfreeOrder(orderData) {
  try {
    const credentials = await getCashfreeCredentials();

    // CRITICAL: Log credential status immediately
    console.error("🔍 CASHFREE CREDENTIALS CHECK:");
    console.error("  App ID present:", !!credentials.appId);
    console.error("  App ID length:", credentials.appId?.length || 0);
    console.error("  App ID preview:", credentials.appId ? `${credentials.appId.substring(0, 6)}...${credentials.appId.substring(credentials.appId.length - 4)}` : "MISSING");
    console.error("  Secret Key present:", !!credentials.secretKey);
    console.error("  Secret Key length:", credentials.secretKey?.length || 0);
    console.error("  Environment CASHFREE_APP_ID:", !!process.env.CASHFREE_APP_ID);
    console.error("  Environment CASHFREE_SECRET_KEY:", !!process.env.CASHFREE_SECRET_KEY);
    console.error("  Environment CASHFREE_SANDBOX:", process.env.CASHFREE_SANDBOX);

    if (!credentials.appId || !credentials.secretKey) {
      console.error("❌ Cashfree credentials missing:", {
        hasAppId: !!credentials.appId,
        hasSecretKey: !!credentials.secretKey,
      });
      throw new Error("Cashfree credentials not configured. Please configure CASHFREE_APP_ID and CASHFREE_SECRET_KEY in environment variables or database settings.");
    }
    
    // Validate credential format (basic checks)
    if (credentials.appId.length < 10 || credentials.secretKey.length < 10) {
      console.error("❌ Cashfree credentials appear invalid (too short):", {
        appIdLength: credentials.appId.length,
        secretKeyLength: credentials.secretKey.length,
      });
      throw new Error("Cashfree credentials appear to be invalid. Please verify your App ID and Secret Key are correct.");
    }
    
    // Check if credentials are empty strings or just whitespace
    if (credentials.appId.trim() === "" || credentials.secretKey.trim() === "") {
      console.error("❌ Cashfree credentials are empty strings");
      throw new Error("Cashfree credentials are empty. Please set valid CASHFREE_APP_ID and CASHFREE_SECRET_KEY.");
    }

    // Validate required fields
    if (!orderData) {
      throw new Error("Order data is required");
    }

    const { amount, orderId, customerName, customerEmail, customerPhone, notes } = orderData;

    // Validate required order data
    if (!amount || amount <= 0) {
      throw new Error("Invalid order amount: amount must be greater than 0");
    }
    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      throw new Error("Invalid order ID: orderId is required and must be a non-empty string");
    }

    // Cashfree API endpoint
    // Check if we should use sandbox (test) mode
    // Sandbox credentials typically start with specific patterns
    const isSandbox = process.env.CASHFREE_SANDBOX === "true" || 
                     (credentials.appId && credentials.appId.toLowerCase().includes("test")) ||
                     (credentials.appId && credentials.appId.toLowerCase().includes("sandbox"));
    
    // Use sandbox endpoint if in sandbox mode, otherwise use production
    const apiUrl = isSandbox 
      ? "https://sandbox.cashfree.com/pg/orders"
      : "https://api.cashfree.com/pg/orders";
    
    console.error("🌐 CASHFREE API ENDPOINT:", apiUrl);
    console.error("🔧 SANDBOX MODE:", isSandbox);
    
    if (isSandbox) {
      console.log("⚠️ Using Cashfree SANDBOX/TEST mode");
    } else {
      console.log("✅ Using Cashfree PRODUCTION mode");
    }

    // Prepare order_meta - only include return_url if it's HTTPS (Cashfree requirement)
    const orderMeta = {};
    if (notes?.returnUrl) {
      // Don't include return_url if it contains placeholder values
      if (notes.returnUrl.includes("PLACEHOLDER")) {
        console.log("Skipping return_url - contains placeholder values");
      } else if (notes.returnUrl.startsWith("https://")) {
        // For HTTPS URLs, construct full returnUrl with orderId if not already present
        let finalReturnUrl = notes.returnUrl;
        // If returnUrl doesn't have query params, we can't add orderId here
        // Cashfree will redirect with orderId in the URL anyway
        orderMeta.return_url = finalReturnUrl;
      } else if (notes.returnUrl.startsWith("http://localhost") || notes.returnUrl.startsWith("http://127.0.0.1")) {
        // For local development, convert HTTP localhost to HTTPS or skip
        // Cashfree doesn't accept HTTP URLs, so we'll skip return_url for localhost
        // The payment will still work, but redirect will be handled by frontend
        console.log("Skipping return_url for localhost HTTP (Cashfree requires HTTPS)");
      } else if (notes.returnUrl.startsWith("http://")) {
        // For other HTTP URLs, try to convert to HTTPS
        orderMeta.return_url = notes.returnUrl.replace("http://", "https://");
      }
    }
    if (notes?.notifyUrl) {
      orderMeta.notify_url = notes.notifyUrl;
    }

    // Validate customer email (Cashfree requires email for some payment methods)
    // If email is missing, use a placeholder or the orderId as email
    const finalCustomerEmail = customerEmail && customerEmail.trim() 
      ? customerEmail.trim() 
      : `customer_${orderId}@placeholder.com`; // Placeholder email if not provided
    
    // Format phone number for Cashfree (should be 10 digits, optionally with country code)
    // Cashfree expects format: +91XXXXXXXXXX or just XXXXXXXXXX (10 digits)
    let finalCustomerPhone = "";
    if (customerPhone && customerPhone.trim()) {
      // Remove all non-digit characters
      const digitsOnly = customerPhone.replace(/\D/g, "");
      if (digitsOnly.length === 10) {
        // If 10 digits, add +91 prefix
        finalCustomerPhone = `+91${digitsOnly}`;
      } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
        // If 12 digits starting with 91, add + prefix
        finalCustomerPhone = `+${digitsOnly}`;
      } else if (digitsOnly.length >= 10) {
        // Use last 10 digits if longer
        finalCustomerPhone = `+91${digitsOnly.slice(-10)}`;
      } else {
        // If less than 10 digits, use as is (might cause validation error)
        finalCustomerPhone = customerPhone.trim();
      }
    }
    
    const requestBody = {
      order_id: orderId,
      order_amount: amount / 100, // Convert paise to rupees
      order_currency: "INR",
      customer_details: {
        customer_id: notes?.userId?.toString() || orderId,
        customer_name: customerName || "Customer",
        customer_email: finalCustomerEmail,
        customer_phone: finalCustomerPhone,
      },
      order_note: notes ? JSON.stringify(notes) : "",
    };

    // Only include order_meta if it has values (Cashfree doesn't accept empty/undefined order_meta)
    if (Object.keys(orderMeta).length > 0) {
      requestBody.order_meta = orderMeta;
    }

    // Validate request body structure
    if (!requestBody.order_id || !requestBody.order_amount || !requestBody.order_currency) {
      throw new Error("Invalid request body: missing required fields (order_id, order_amount, order_currency)");
    }
    
    if (!requestBody.customer_details || !requestBody.customer_details.customer_id) {
      throw new Error("Invalid request body: missing required customer_details");
    }

    // Log request details for debugging (without sensitive data)
    console.log("Creating Cashfree order:", {
      orderId: orderId,
      amount: amount / 100,
      currency: "INR",
      customerName: customerName || "Customer",
      customerEmail: finalCustomerEmail.substring(0, 20) + "...", // Log partial email for debugging
      hasReturnUrl: !!orderMeta.return_url,
      hasNotifyUrl: !!orderMeta.notify_url,
      hasAppId: !!credentials.appId,
      appIdLength: credentials.appId?.length || 0,
      hasSecretKey: !!credentials.secretKey,
      secretKeyLength: credentials.secretKey?.length || 0,
      requestBodyKeys: Object.keys(requestBody),
      customerDetailsKeys: Object.keys(requestBody.customer_details),
    });
    
    // Log the actual request body structure (without sensitive values)
    console.log("Cashfree request body structure:", {
      order_id: requestBody.order_id,
      order_amount: requestBody.order_amount,
      order_currency: requestBody.order_currency,
      customer_details: {
        customer_id: requestBody.customer_details.customer_id,
        customer_name: requestBody.customer_details.customer_name,
        customer_email: requestBody.customer_details.customer_email?.substring(0, 20) + "...",
        customer_phone: requestBody.customer_details.customer_phone ? "***" : "",
      },
      has_order_meta: !!requestBody.order_meta,
      order_meta_keys: requestBody.order_meta ? Object.keys(requestBody.order_meta) : [],
      has_order_note: !!requestBody.order_note,
    });

    // Add timeout to fetch request (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2022-09-01",
          "x-client-id": credentials.appId,
          "x-client-secret": credentials.secretKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle network errors and timeouts
      if (fetchError.name === 'AbortError') {
        console.error("Cashfree API request timeout after 30 seconds");
        throw new Error("Cashfree API request timeout: The request took too long to complete");
      }
      
      if (fetchError.message === "Failed to fetch" || fetchError.code === "ECONNREFUSED" || fetchError.code === "ENOTFOUND") {
        console.error("Cashfree API network error:", fetchError.message || fetchError.code);
        throw new Error("Network error: Unable to connect to Cashfree API. Please check your internet connection.");
      }
      
      // Re-throw other fetch errors
      console.error("Cashfree API fetch error:", fetchError);
      throw new Error(`Cashfree API request failed: ${fetchError.message || "Unknown error"}`);
    }

    if (!response.ok) {
      let errorMessage = `Cashfree API error: ${response.status} ${response.statusText}`;
      let errorDetails = null;
      
      try {
        // Clone response to read it multiple times if needed
        const responseClone = response.clone();
        const errorData = await response.json();
        
        // Log full error response for debugging (this is critical for diagnosing 500 errors)
        console.error("═══════════════════════════════════════════════════════");
        console.error("Cashfree API ERROR RESPONSE (FULL):");
        console.error("Status:", response.status, response.statusText);
        console.error("Error Data:", JSON.stringify(errorData, null, 2));
        console.error("Request URL:", apiUrl);
        console.error("Request Headers (sanitized):", {
          "Content-Type": "application/json",
          "x-api-version": "2022-09-01",
          "x-client-id": credentials.appId ? `${credentials.appId.substring(0, 4)}...${credentials.appId.substring(credentials.appId.length - 4)}` : "MISSING",
          "x-client-secret": credentials.secretKey ? "***" : "MISSING",
        });
        console.error("Request Body:", JSON.stringify(requestBody, null, 2));
        console.error("═══════════════════════════════════════════════════════");
        
        // Extract error message from various possible fields
        errorMessage = 
          errorData.message || 
          errorData.error?.message || 
          errorData.error?.description ||
          errorData.error?.code ||
          errorData.error ||
          errorData.msg ||
          errorData.type ||
          errorData.code ||
          (typeof errorData === 'string' ? errorData : errorMessage);
        
        // If error message is too generic, add more context
        if (errorMessage.toLowerCase().includes("api request failed") || 
            errorMessage.toLowerCase().includes("request failed") ||
            errorMessage === "api Request Failed") {
          // Try to get more details from the error object
          const detailedError = errorData.error || errorData;
          const subMessage = detailedError?.message || detailedError?.description || detailedError?.code;
          
          // Log the full error structure for debugging
          console.error("Full error structure:", {
            errorData,
            detailedError,
            subMessage,
            allKeys: Object.keys(errorData || {}),
          });
          
          // For 500 errors, provide more specific guidance
          if (response.status === 500) {
            // Check for specific error codes or messages
            const errorCode = errorData.code || errorData.error?.code || detailedError?.code;
            const errorType = errorData.type || errorData.error?.type;
            
            let diagnosticMessage = "Internal server error at Cashfree.";
            if (errorCode) {
              diagnosticMessage += ` Error code: ${errorCode}.`;
            }
            if (errorType) {
              diagnosticMessage += ` Error type: ${errorType}.`;
            }
            diagnosticMessage += " Common causes: Invalid API credentials, wrong API endpoint (sandbox vs production), account not activated, or missing permissions.";
            
            errorMessage = `Cashfree API server error (500): ${subMessage || diagnosticMessage}`;
          } else {
            errorMessage = `Cashfree API request failed (${response.status}): ${subMessage || "Please verify your API credentials (App ID and Secret Key) are correct and have proper permissions"}`;
          }
        }
        
        errorDetails = errorData;
      } catch (e) {
        try {
          const errorText = await response.text();
          console.error("Cashfree API error response (text):", errorText);
          if (errorText) {
            errorMessage = errorText;
            errorDetails = { rawResponse: errorText };
          } else {
            errorDetails = { status: response.status, statusText: response.statusText };
          }
        } catch (e2) {
          // Use default error message
          errorDetails = { status: response.status, statusText: response.statusText };
        }
      }
      
      // Log detailed error for debugging (without sensitive data)
      console.error("Cashfree API error details:", {
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        errorDetails: errorDetails ? JSON.stringify(errorDetails).substring(0, 500) : null, // Limit length
        orderId: orderId,
        amount: amount / 100,
        requestBody: {
          order_id: requestBody.order_id,
          order_amount: requestBody.order_amount,
          order_currency: requestBody.order_currency,
          has_customer_details: !!requestBody.customer_details,
          customer_id: requestBody.customer_details?.customer_id,
          has_order_meta: !!requestBody.order_meta,
        },
        credentialsCheck: {
          hasAppId: !!credentials.appId,
          appIdLength: credentials.appId?.length || 0,
          hasSecretKey: !!credentials.secretKey,
          secretKeyLength: credentials.secretKey?.length || 0,
        },
      });
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Log successful order creation for debugging
    console.log("Cashfree order created successfully:", {
      orderId: data.order_id || orderId,
      paymentSessionId: data.payment_session_id,
    });
    
    return data;
  } catch (error) {
    // Don't log if it's already been logged above
    if (!error.message.includes("Cashfree API")) {
      console.error("Error creating Cashfree order:", {
        message: error.message,
        stack: error.stack,
        orderId: orderData?.orderId,
        amount: orderData?.amount,
      });
    }
    throw error;
  }
}

/**
 * Verify Cashfree payment
 * @param {string} orderId - Order ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>}
 */
export async function verifyCashfreePayment(orderId, paymentId) {
  try {
    const credentials = await getCashfreeCredentials();

    if (!credentials.appId || !credentials.secretKey) {
      throw new Error("Cashfree credentials not configured");
    }

    // Cashfree payment verification endpoint
    const apiUrl = `https://api.cashfree.com/pg/orders/${orderId}/payments/${paymentId}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": credentials.appId,
        "x-client-secret": credentials.secretKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Cashfree API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error verifying Cashfree payment:", error);
    throw error;
  }
}

/**
 * Verify Cashfree payment signature
 * @param {string} orderId - Order ID
 * @param {string} orderAmount - Order amount
 * @param {string} referenceId - Payment reference ID
 * @param {string} txStatus - Transaction status
 * @param {string} paymentMode - Payment mode
 * @param {string} txMsg - Transaction message
 * @param {string} txTime - Transaction time
 * @param {string} signature - Signature to verify
 * @returns {boolean}
 */
export async function verifyCashfreeSignature(
  orderId,
  orderAmount,
  referenceId,
  txStatus,
  paymentMode,
  txMsg,
  txTime,
  signature
) {
  try {
    const credentials = await getCashfreeCredentials();

    // Create signature string
    const signatureData = `${orderId}${orderAmount}${referenceId}${txStatus}${paymentMode}${txMsg}${txTime}`;

    // Generate HMAC SHA256 signature
    const crypto = await import("crypto");
    const generatedSignature = crypto
      .createHmac("sha256", credentials.secretKey)
      .update(signatureData)
      .digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Error verifying Cashfree signature:", error);
    return false;
  }
}
