import Employee from "../models/Employee.js";
import PayoutHistory from "../models/PayoutHistory.js";
import Settings from "../models/Settings.js";
import { 
  createRazorpayXContact, 
  createRazorpayXFundAccount, 
  callRazorpayX 
} from "../utils/razorpayX.js";
import crypto from "crypto";
import { getRazorpayCredentials } from "../utils/razorpay.js";

/**
 * Helper to test a payout via RazorpayX (Real API call but for testing purposes)
 */
export const testRazorpayPayout = async (req, res) => {
  try {
    const { name, email, phone, ifscCode, accountNumber, amount, remark } = req.body;

    if (!accountNumber || !ifscCode || !amount) {
      return res.status(400).json({ success: false, message: "Missing required details (accountNumber, ifscCode, amount)." });
    }

    const settings = await Settings.getSettings();
    const sourceAccountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER || settings.razorpayX?.accountNumber;

    if (!sourceAccountNumber) {
      return res.status(500).json({ success: false, message: "RazorpayX Account Number is not configured in settings." });
    }

    // 1. Create/Get Contact
    const contactResponse = await createRazorpayXContact({
      name: name || "Test User",
      email: email || "test@jssabhiyan.com",
      contact: phone || "9999999999",
      userId: `TEST_${Date.now()}`,
    }, true);
    const contactId = contactResponse.id;

    // 2. Create Fund Account
    const fundAccountResponse = await createRazorpayXFundAccount(contactId, {
      accountHolderName: name || "Test User",
      ifscCode: ifscCode,
      accountNumber: accountNumber,
    }, true);
    const fundAccountId = fundAccountResponse.id;

    // 3. Initiate Payout
    const payoutResponse = await callRazorpayX("/payouts", "POST", {
      account_number: sourceAccountNumber,
      fund_account_id: fundAccountId,
      amount: Math.round(amount * 100),
      currency: "INR",
      mode: "NEFT",
      purpose: "salary",
      queue_if_low_balance: true,
      reference_id: `PAYOUT_TEST_${Date.now()}`,
      narration: remark || "Test Payout",
    }, true);

    return res.json({
      success: true,
      message: "Test Payout successfully initiated via RazorpayX",
      data: payoutResponse
    });

  } catch (error) {
    console.error("Test Payout Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to process test payout." });
  }
};

/**
 * Helper to initiate a payout via RazorpayX
 */
export const initiateAdminPayout = async (req, res) => {
  try {
    const { employeeIds, remark } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ success: false, message: "No employees selected for payout." });
    }

    const settings = await Settings.getSettings();
    const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER || settings.razorpayX?.accountNumber;

    if (!accountNumber) {
      return res.status(500).json({ success: false, message: "RazorpayX Account Number is not configured." });
    }

    const results = {
      successful: [],
      failed: [],
    };

    // Find all employees
    const employees = await Employee.find({ _id: { $in: employeeIds } }).populate('userId');

    for (const employee of employees) {
      try {
        const amountToPay = employee.salaryWallet;

        if (!amountToPay || amountToPay <= 0) {
          throw new Error("Earning is zero or negative.");
        }

        if (!employee.accountNumber || !employee.ifscCode) {
          throw new Error("Bank account details missing.");
        }

        // --- TEST MOCK FLOW ---
        if (employee.accountNumber === "0000000000" || employee.accountNumber === "1234567890" || employee.accountNumber.toLowerCase() === "test") {
          const dummyPayoutId = `pout_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          
          const payoutRecord = new PayoutHistory({
            employeeId: employee._id,
            amount: amountToPay,
            payoutId: dummyPayoutId,
            fundAccountId: "fa_test_mock",
            status: "processed", // mark as processed instantly for testing
            remarks: (remark || "Salary Payout") + " [TEST MODE]",
            processedBy: req.user.id,
          });

          await payoutRecord.save();

          employee.salaryWallet = 0;
          await employee.save();

          results.successful.push({
            employeeId: employee._id,
            name: employee.accountHolderName || employee.name,
            payoutId: dummyPayoutId,
          });

          console.log(`✅ [TEST MODE] Mock Payout successful for ${employee.name}`);
          continue; // Skip Razorpay API call
        }
        // --- END TEST MOCK FLOW ---

        // 1. Create/Get Contact
        const contactResponse = await createRazorpayXContact({
          name: employee.accountHolderName || employee.name,
          email: employee.userId?.email || `${employee._id}@jssabhiyan.com`,
          contact: employee.userId?.phone || "9999999999",
          userId: employee._id.toString(),
        });
        
        const contactId = contactResponse.id;

        // 2. Create Fund Account
        const fundAccountResponse = await createRazorpayXFundAccount(contactId, {
          accountHolderName: employee.accountHolderName || employee.name,
          ifscCode: employee.ifscCode,
          accountNumber: employee.accountNumber,
        });

        const fundAccountId = fundAccountResponse.id;

        // 3. Initiate Payout
        const payoutResponse = await callRazorpayX("/payouts", "POST", {
          account_number: accountNumber,
          fund_account_id: fundAccountId,
          amount: Math.round(amountToPay * 100),
          currency: "INR",
          mode: "NEFT",
          purpose: "salary",
          queue_if_low_balance: true,
          reference_id: `PAYOUT_${employee._id}_${Date.now()}`,
          narration: remark || "Salary Payout",
        });

        // 4. Save to DB
        const payoutRecord = new PayoutHistory({
          employeeId: employee._id,
          amount: amountToPay,
          payoutId: payoutResponse.id,
          fundAccountId: fundAccountId,
          status: payoutResponse.status || "pending",
          remarks: remark || "Salary Payout",
          processedBy: req.user.id,
        });

        await payoutRecord.save();

        // 5. Reset Salary Wallet
        employee.salaryWallet = 0;
        await employee.save();

        results.successful.push({
          employeeId: employee._id,
          name: employee.name,
          amount: amountToPay,
          payoutId: payoutResponse.id,
        });

      } catch (err) {
        console.error(`Failed payout for employee ${employee._id}:`, err.message);
        results.failed.push({
          employeeId: employee._id,
          name: employee.name,
          error: err.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Payout processing completed.",
      results,
    });

  } catch (error) {
    console.error("Initiate Payout Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getPayoutHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, role, dateRange, startDate, endDate } = req.query;

    const query = {};
    if (status) query.status = status;

    // Date Filtering
    if (dateRange && dateRange !== "all") {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      if (dateRange === "today") {
        query.createdAt = { $gte: startOfDay };
      } else if (dateRange === "yesterday") {
        const startOfYesterday = new Date(startOfDay);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(startOfDay);
        endOfYesterday.setMilliseconds(endOfYesterday.getMilliseconds() - 1);
        query.createdAt = { $gte: startOfYesterday, $lte: endOfYesterday };
      } else if (dateRange === "last7days") {
        const last7Days = new Date(startOfDay);
        last7Days.setDate(last7Days.getDate() - 6);
        query.createdAt = { $gte: last7Days };
      } else if (dateRange === "last30days") {
        const last30Days = new Date(startOfDay);
        last30Days.setDate(last30Days.getDate() - 29);
        query.createdAt = { $gte: last30Days };
      } else if (dateRange === "thisMonth") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query.createdAt = { $gte: startOfMonth };
      } else if (dateRange === "pastMonth") {
        const startOfPastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query.createdAt = { $gte: startOfPastMonth, $lt: endOfPastMonth };
      } else if (dateRange === "custom_date" && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt = { $gte: start, $lte: end };
      }
    }

    let employeeIds = [];
    let employeeQuery = {};
    
    if (search) {
      employeeQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { accountNumber: { $regex: search, $options: "i" } },
      ];
    }
    
    if (role && role !== "all") {
      employeeQuery.role = role.toUpperCase();
    }

    if (Object.keys(employeeQuery).length > 0) {
      const employees = await Employee.find(employeeQuery).select('_id');
      employeeIds = employees.map(e => e._id);
      query.employeeId = { $in: employeeIds };
    }

    const total = await PayoutHistory.countDocuments(query);
    const history = await PayoutHistory.find(query)
      .populate("employeeId", "name email phone accountNumber ifscCode")
      .populate("processedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Payout History Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.rawBody || JSON.stringify(req.body))
        .digest("hex");

      if (expectedSignature !== signature) {
        console.warn("Invalid Razorpay Webhook Signature");
        return res.status(400).send("Invalid signature");
      }
    }

    const { event, payload } = req.body;

    if (event.startsWith("payout.")) {
      const payoutData = payload.payout.entity;
      const payoutId = payoutData.id;
      const status = payoutData.status; // processed, reversed, failed, rejected

      const payoutRecord = await PayoutHistory.findOne({ payoutId });

      if (payoutRecord) {
        payoutRecord.status = status;
        if (payoutData.failure_reason) {
          payoutRecord.failureReason = payoutData.failure_reason;
        }
        await payoutRecord.save();

        // If reversed or failed/rejected, we should refund the wallet
        if (["reversed", "failed", "rejected"].includes(status)) {
           const employee = await Employee.findById(payoutRecord.employeeId);
           if (employee) {
             // We add back the amount to their wallet
             // Using an atomic update to avoid race conditions
             await Employee.updateOne(
               { _id: employee._id },
               { $inc: { salaryWallet: payoutRecord.amount } }
             );
           }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    res.status(500).send("Internal server error");
  }
};
