import WithdrawalRequest from "../models/WithdrawalRequest.js";
import Employee from "../models/Employee.js";
import BankAccount from "../models/BankAccount.js";
import Notification from "../models/Notification.js";
import AdministrativeStaff from "../models/AdministrativeStaff.js";
import Settings from "../models/Settings.js";
import axios from "axios";
import { getRazorpayCredentials } from "../utils/razorpay.js";
import {
  createRazorpayXContact,
  createRazorpayXFundAccount,
  createRazorpayXPayout
} from "../utils/razorpayX.js";


/**
 * Employee: Request a withdrawal
 */
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, bankAccountId } = req.body;
    const userId = req.user.id;

    // Find profile (Employee or Staff)
    let profile = await Employee.findOne({ userId });
    let profileModel = Employee;

    if (!profile) {
      profile = await AdministrativeStaff.findOne({ userId });
      profileModel = AdministrativeStaff;
    }

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (amount < 500) {
      return res.status(400).json({ message: "Minimum withdrawal amount is ₹500" });
    }

    // Check for existing pending request
    const existingPending = await WithdrawalRequest.findOne({ employeeId: profile._id, status: "pending" });
    if (existingPending) {
      return res.status(400).json({ message: "You already have a pending withdrawal request. Please wait for it to be processed." });
    }

    // NOTE: For 'Staff' requestType, we bypass the salaryWallet check.
    // The frontend will validate the amount dynamically for Staff based on attendance.
    if (profileModel === Employee) {
      if (profile.salaryWallet < amount) {
        return res.status(400).json({ message: "Insufficient balance in salary wallet" });
      }
      profile.salaryWallet -= amount;
      await profile.save();
    }

    // Find bank account
    const bankAccount = await BankAccount.findById(bankAccountId);
    if (!bankAccount || bankAccount.employeeId.toString() !== profile._id.toString()) {
      return res.status(404).json({ message: "Invalid bank account selected" });
    }

    // Create request
    const withdrawal = new WithdrawalRequest({
      employeeId: profile._id,
      userId,
      amount,
      requestType: profileModel === AdministrativeStaff ? "Staff" : "Employee",
      bankDetails: {
        accountNumber: bankAccount.accountNumber,
        ifscCode: bankAccount.ifscCode,
        bankName: bankAccount.bankName,
        accountHolderName: bankAccount.accountHolderName,
      },
      status: "pending",
    });

    await withdrawal.save();

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Staff: Request a withdrawal (Current Month)
 */
export const requestStaffWithdrawal = async (req, res) => {
  try {
    const { amount, bankAccountId, maxAvailable } = req.body;
    const userId = req.user.id;

    let profile = await AdministrativeStaff.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    if (!amount || amount < 500) {
      return res.status(400).json({ message: "Minimum withdrawal amount is ₹500" });
    }

    // Check for existing pending request
    const existingPending = await WithdrawalRequest.findOne({ employeeId: profile._id, status: "pending" });
    if (existingPending) {
      return res.status(400).json({ message: "You already have a pending withdrawal request. Please wait for it to be processed." });
    }

    if (maxAvailable !== undefined && amount > maxAvailable) {
      return res.status(400).json({ message: "Amount exceeds withdrawable limit for this month" });
    }

    const bankAccount = await BankAccount.findById(bankAccountId);
    if (!bankAccount || bankAccount.employeeId.toString() !== profile._id.toString()) {
      return res.status(404).json({ message: "Invalid bank account selected" });
    }

    const withdrawal = new WithdrawalRequest({
      employeeId: profile._id,
      userId,
      amount,
      requestType: "Staff",
      bankDetails: {
        accountNumber: bankAccount.accountNumber,
        ifscCode: bankAccount.ifscCode,
        bankName: bankAccount.bankName,
        accountHolderName: bankAccount.accountHolderName,
      },
      status: "pending",
    });

    await withdrawal.save();

    res.status(201).json({
      success: true,
      message: "Staff withdrawal request submitted successfully",
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Staff: Get withdrawal history
 */
export const getStaffWithdrawalHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, currentMonth = false } = req.query;
    const userId = req.user.id;
    const skip = (page - 1) * limit;

    let profile = await AdministrativeStaff.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const query = { employeeId: profile._id, requestType: "Staff" };

    if (currentMonth === 'true') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfMonth };
    }

    const withdrawals = await WithdrawalRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await WithdrawalRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: withdrawals,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Approve Withdrawal (Manual)
 */
export const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { baseAmount, otherExpenses = 0, remark = "", paymentMethod = "manual" } = req.body;

    const withdrawal = await WithdrawalRequest.findById(id).populate("userId");

    if (!withdrawal) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "Only pending requests can be approved" });
    }

    let profile = await Employee.findById(withdrawal.employeeId);
    if (!profile) {
      profile = await AdministrativeStaff.findById(withdrawal.employeeId);
    }

    // Handle baseAmount change and adjust salaryWallet if necessary
    if (baseAmount !== undefined && Number(baseAmount) !== withdrawal.amount) {
      const difference = withdrawal.amount - Number(baseAmount); // e.g. req 100, base 80 -> diff 20 (refund 20)
      if (profile && withdrawal.requestType !== "Staff") {
        if (difference < 0 && profile.salaryWallet < Math.abs(difference)) {
          return res.status(400).json({ message: "Employee has insufficient balance for increased base amount" });
        }
        profile.salaryWallet += difference;
        await profile.save();
      }
      withdrawal.amount = Number(baseAmount);
    }

    withdrawal.otherExpenses = Number(otherExpenses);
    withdrawal.adminRemark = remark;
    withdrawal.paymentMethod = paymentMethod;

    const finalPayableAmount = withdrawal.amount + withdrawal.otherExpenses;

    if (paymentMethod === "razorpay") {

      const settings = await Settings.getSettings();
      const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER || settings.razorpayX?.accountNumber;
      if (!accountNumber) {
        return res.status(500).json({ message: "RazorpayX Account Number is not configured." });
      }

      // 1. Create/Get Contact
      const contactResponse = await createRazorpayXContact({
        name: withdrawal.bankDetails.accountHolderName,
        email: withdrawal.userId.email || "test@jssabhiyan.com",
        contact: withdrawal.userId.phone || "9999999999",
        userId: withdrawal.userId._id.toString()
      });

      // 2. Create Fund Account
      const fundAccountResponse = await createRazorpayXFundAccount(contactResponse.id, withdrawal.bankDetails);

      // 3. Initiate Payout
      const payoutResponse = await createRazorpayXPayout({
        accountNumber,
        fundAccountId: fundAccountResponse.id,
        amount: finalPayableAmount,
        withdrawalId: withdrawal._id.toString()
      });

      withdrawal.payoutId = payoutResponse.id;
    }

    withdrawal.status = "success";
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    res.status(200).json({
      success: true,
      message: paymentMethod === "razorpay" ? "Withdrawal processed successfully via Razorpay" : "Withdrawal approved successfully",
      withdrawal
    });
  } catch (error) {
    console.error("[APPROVE_ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Reject a withdrawal
 */
export const rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal || withdrawal.status !== "pending") {
      return res.status(400).json({ message: "Invalid request or already processed" });
    }

    withdrawal.status = "rejected";
    withdrawal.rejectionReason = reason;

    // Refund balance (check both collections)
    let profile = await Employee.findById(withdrawal.employeeId);
    if (!profile) {
      profile = await AdministrativeStaff.findById(withdrawal.employeeId);
    }

    if (profile && withdrawal.requestType !== "Staff") {
      profile.salaryWallet += withdrawal.amount;
      await Promise.all([withdrawal.save(), profile.save()]);
    } else {
      await withdrawal.save();
    }

    // Notify employee
    // await Notification.create({
    //   recipient: withdrawal.userId,
    //   createdBy: req.user.id,
    //   title: "Withdrawal Rejected",
    //   message: `Your withdrawal of ₹${withdrawal.amount} was rejected. Reason: ${reason}`,
    //   type: "error",
    // });

    res.status(200).json({
      success: true,
      message: "Withdrawal rejected and balance restored"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Revert a successful withdrawal to refunded status
 */
export const revertWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal || withdrawal.status !== "success") {
      return res.status(400).json({ message: "Invalid request or not in success status" });
    }

    // Change status to refunded
    withdrawal.status = "refunded";
    withdrawal.rejectionReason = "Reverted by Admin";

    // Refund balance (check both collections)
    let profile = await Employee.findById(withdrawal.employeeId);
    if (!profile) {
      profile = await AdministrativeStaff.findById(withdrawal.employeeId);
    }

    if (profile && withdrawal.requestType !== "Staff") {
      profile.salaryWallet += withdrawal.amount;
      await Promise.all([withdrawal.save(), profile.save()]);
    } else {
      await withdrawal.save();
    }

    res.status(200).json({
      success: true,
      message: "Withdrawal reverted to refunded and balance restored"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * Employee: Add Bank Account
 */
export const addBankAccount = async (req, res) => {
  try {
    const { accountHolderName, bankName, accountNumber, ifscCode, isPrimary } = req.body;
    const userId = req.user.id;

    console.log(`[BANK_ADD] Attempting to add bank for userId: ${userId}`);

    // Look for profile in both Employee (Covers Exam-pass & Manual) and AdministrativeStaff (Staff)
    let profile = await Employee.findOne({ userId });
    let profileType = "Employee/Manual";

    if (!profile) {
      profile = await AdministrativeStaff.findOne({ userId });
      profileType = "AdministrativeStaff/Staff";
    }

    if (!profile) {
      console.warn(`[BANK_ADD] No profile found for userId: ${userId} in any collection`);
      return res.status(404).json({
        message: "Profile not found. Please ensure you are registered as an employee or staff member.",
        details: `Searched in Employee and AdministrativeStaff for userId: ${userId}`
      });
    }

    console.log(`[BANK_ADD] Found ${profileType} profile for userId: ${userId}. ProfileId: ${profile._id}`);

    const bankAccount = new BankAccount({
      employeeId: profile._id,
      userId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      isPrimary,
    });

    await bankAccount.save();
    console.log(`[BANK_ADD] Successfully saved bank account for userId: ${userId}`);

    res.status(201).json({ success: true, message: "Bank account added successfully", bankAccount });
  } catch (error) {
    console.error(`[BANK_ADD] Error adding bank account:`, error);
    res.status(500).json({
      message: "Internal server error while adding bank account",
      error: error.message
    });
  }
};

/**
 * Get Lists
 */
export const getMyWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawals = await WithdrawalRequest.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: withdrawals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminGetAllWithdrawals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { search, role, state, district, block, panchayat, status, requestType } = req.query;

    const pipeline = [];

    // Filter by requestType if provided
    if (requestType && requestType !== "all") {
      if (requestType === "Employee") {
        pipeline.push({ 
          $match: { 
            $or: [
              { requestType: "Employee" },
              { requestType: { $exists: false } },
              { requestType: null }
            ] 
          } 
        });
      } else {
        pipeline.push({ $match: { requestType } });
      }
    }

    // 1. Join with employees or administrativestaffs collection
    pipeline.push({
      $lookup: {
        from: requestType === "Staff" ? "administrativestaffs" : "employees",
        localField: "employeeId",
        foreignField: "_id",
        as: "employee"
      }
    });

    pipeline.push({
      $unwind: {
        path: "$employee",
        preserveNullAndEmptyArrays: true
      }
    });

    // 2. Match Filters
    const matchStage = {};
    if (status && status !== "all") {
      matchStage.status = status;
    }
    if (role && role !== "all") {
      matchStage["employee.role"] = role;
    }
    if (state && state !== "all") {
      const cleanState = state.split('/')[0].trim();
      matchStage["employee.workingState"] = { $regex: new RegExp(`^${cleanState}`, "i") };
    }
    if (district && district !== "all") {
      matchStage["employee.workingDistrict"] = district;
    }
    if (block && block !== "all") {
      matchStage["employee.workingBlock"] = block;
    }
    if (panchayat && panchayat !== "all") {
      matchStage["employee.workingPanchayat"] = panchayat;
    }

    // Search by employee name, id, or amount
    if (search) {
      const searchNumber = Number(search);
      const searchConditions = [
        { "employee.name": { $regex: search, $options: "i" } }
      ];

      // If search is a valid number, also search amount
      if (!isNaN(searchNumber)) {
        searchConditions.push({ amount: searchNumber });
      }

      // We don't do regex on ObjectIDs natively easily, but we can do a text match on stringified IDs if needed. 
      // Mongoose handles it better if we explicitly pass ObjectId, but let's stick to name and amount for now.

      matchStage.$or = searchConditions;
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // 3. Group by employee to prepare the grouped structure for frontend
    pipeline.push({
      $group: {
        _id: "$employeeId",
        employee: { $first: "$employee" },
        requests: { $push: "$$ROOT" },
        totalPending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] }
        },
        totalPaid: {
          $sum: { $cond: [{ $eq: ["$status", "success"] }, "$amount", 0] }
        },
        totalRequests: { $sum: 1 }
      }
    });

    // 4. Sort by most pending amounts first
    pipeline.push({
      $sort: { totalPending: -1, "employee.name": 1 }
    });

    // 5. Pagination using Facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
        globalStats: [
          { $unwind: "$requests" },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: { $cond: [{ $eq: ["$requests.status", "success"] }, "$requests.amount", 0] } },
              pendingCount: { $sum: { $cond: [{ $eq: ["$requests.status", "pending"] }, 1, 0] } },
              successCount: { $sum: { $cond: [{ $eq: ["$requests.status", "success"] }, 1, 0] } },
              rejectedCount: { $sum: { $cond: [{ $in: ["$requests.status", ["rejected", "failed"]] }, 1, 0] } }
            }
          }
        ]
      }
    });

    const result = await WithdrawalRequest.aggregate(pipeline);

    const data = result[0].data;
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    const pages = Math.ceil(total / limit);
    const globalStats = result[0].globalStats[0] || { totalAmount: 0, pendingCount: 0, successCount: 0, rejectedCount: 0 };

    res.status(200).json({
      success: true,
      data,
      stats: globalStats,
      pagination: {
        total,
        page,
        pages,
        limit
      }
    });

  } catch (error) {
    console.error("[ADMIN_WITHDRAWALS_ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAdminEmployeeRequests = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { employeeId };

    const total = await WithdrawalRequest.countDocuments(query);
    const requests = await WithdrawalRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        page,
        pages,
        limit
      }
    });
  } catch (error) {
    console.error("[ADMIN_EMPLOYEE_REQUESTS_ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyBankAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    let accounts = await BankAccount.find({ userId, status: "active" });

    // If no bank accounts exist, auto-migrate from Employee/Staff profile (MOU details)
    if (accounts.length === 0) {
      let profile = await Employee.findOne({ userId });
      if (!profile) {
        profile = await AdministrativeStaff.findOne({ userId });
      }

      if (profile && profile.accountNumber && profile.bankName) {
        const newBankAccount = new BankAccount({
          employeeId: profile._id,
          userId,
          accountHolderName: profile.accountHolderName || profile.name,
          bankName: profile.bankName,
          accountNumber: profile.accountNumber,
          ifscCode: profile.ifscCode,
          isPrimary: true,
        });

        await newBankAccount.save();
        accounts = [newBankAccount];
        console.log(`[BANK_AUTO_MIGRATE] Migrated bank details from profile for userId: ${userId}`);
      }
    }

    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
