import axios from "axios";
import { getRazorpayCredentials, getRazorpayXCredentials } from "./razorpay.js";
import Settings from "../models/Settings.js";

/**
 * Call Razorpay X API
 */
export const callRazorpayX = async (endpoint, method, data, forceTestMode = false) => {
  const credentials = await getRazorpayXCredentials(forceTestMode);
  const settings = await Settings.getSettings();
  const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER || settings.razorpayX?.accountNumber;
  console.log(credentials)

  if (!credentials.keyId || !credentials.keySecret) {
    throw new Error("Razorpay credentials not configured");
  }

  const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64");

  try {
    const response = await axios({
      url: `https://api.razorpay.com/v1${endpoint}`,
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      data: data,
    });
    return response.data;
  } catch (error) {
    const errorData = error.response?.data?.error;
    let errMessage = "RazorpayX API failed";
    
    if (errorData) {
      if (typeof errorData === 'string') {
        errMessage = errorData;
      } else if (errorData.description) {
        errMessage = errorData.description;
      } else if (errorData.message) {
        errMessage = errorData.message;
      } else {
        errMessage = JSON.stringify(errorData);
      }
    }
    
    console.error(`RazorpayX API Error [${endpoint}]:`, errMessage);
    throw new Error(errMessage);
  }
};

/**
 * Create or Update Contact
 */
export const createRazorpayXContact = async (contactData, forceTestMode = false) => {
  return callRazorpayX("/contacts", "POST", {
    name: contactData.name,
    email: contactData.email,
    contact: contactData.contact,
    type: "employee",
    reference_id: contactData.userId,
  }, forceTestMode);
};

/**
 * Create Fund Account (Bank)
 */
export const createRazorpayXFundAccount = async (contactId, bankDetails, forceTestMode = false) => {
  return callRazorpayX("/fund_accounts", "POST", {
    contact_id: contactId,
    account_type: "bank_account",
    bank_account: {
      name: bankDetails.accountHolderName,
      ifsc: bankDetails.ifscCode,
      account_number: bankDetails.accountNumber,
    },
  }, forceTestMode);
};

/**
 * Create Payout
 */
export const createRazorpayXPayout = async (payoutData) => {
  console.log("[RAZORPAYX_DEBUG] Payout Data:", JSON.stringify(payoutData, null, 2));
  return callRazorpayX("/payouts", "POST", {
    account_number: payoutData.accountNumber,
    fund_account_id: payoutData.fundAccountId,
    amount: Math.round(payoutData.amount * 100),
    currency: "INR",
    mode: "NEFT", // Changed to NEFT for better test compatibility
    purpose: "salary", // Standard purpose
    queue_if_low_balance: true,
    reference_id: payoutData.withdrawalId,
    narration: "Employee Salary Withdrawal",
  });
};
