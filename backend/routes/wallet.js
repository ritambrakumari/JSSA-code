import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { getRazorpayInstance, getRazorpayKeyId, getRazorpayCredentials, getWebhookSecret } from '../utils/razorpay.js';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
import Employee from '../models/Employee.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Application from '../models/Application.js';

const router = express.Router();

/**
 * @desc    Get current wallet balance
 * @route   GET /api/wallet/balance
 * @access  Private
 */
router.get('/balance', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({ success: true, balance: employee.walletBalance || 0 });
  } catch (error) {
    console.error('Get Balance Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @desc    Get total lifetime earnings
 * @route   GET /api/wallet/lifetime-earnings
 * @access  Private
 */
router.get('/lifetime-earnings', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id,
      type: { $in: ['CREDIT_COMMISSION', 'CREDIT_LEAD'] },
      status: 'SUCCESS'
    });
    
    const totalEarnings = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    res.json({ success: true, totalEarnings });
  } catch (error) {
    console.error('Get Lifetime Earnings Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @desc    Get transaction history
 * @route   GET /api/wallet/history
 * @access  Private
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };
    
    if (req.query.type) {
      if (req.query.type === 'COMMISSION') {
        query.type = { $in: ['CREDIT_COMMISSION', 'CREDIT_LEAD'] };
      } else if (req.query.type === 'WALLET') {
        query.type = { $nin: ['CREDIT_COMMISSION', 'CREDIT_LEAD'] };
      } else {
        query.type = req.query.type;
      }
    }

    const { dateRange, startDate, endDate } = req.query;
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

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const aggQuery = { ...query };
    if (aggQuery.userId) {
      aggQuery.userId = new mongoose.Types.ObjectId(aggQuery.userId);
    }

    const breakdownAggregation = await Transaction.aggregate([
      { $match: aggQuery },
      { 
        $group: { 
          _id: "$amount", 
          count: { $sum: 1 }, 
          totalAmount: { $sum: "$amount" },
          sampleRemark: { $first: "$remarks" }
        } 
      },
      { $sort: { _id: -1 } }
    ]);
    const totalAmount = breakdownAggregation.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const formattedBreakdown = breakdownAggregation.map(item => {
      let label = "Commission";
      if (item.sampleRemark) {
        const remark = item.sampleRemark.toLowerCase();
        if (remark.includes('hierarchy') || remark.includes('team')) {
          label = "Team";
        } else if (remark.includes('commission for card issuance') || remark.includes('direct') || remark.includes('issued card to')) {
          label = "Self Issued";
        } else if (remark.includes('lead')) {
          label = "Lead";
        } else if (remark.includes('bonus')) {
          label = "Bonus";
        }
      }
      return { ...item, label };
    });

    const Settings = mongoose.model('Settings');
    const settings = await Settings.getSettings();

    res.json({
      success: true,
      data: transactions,
      summary: {
        totalAmount,
        breakdown: formattedBreakdown,
        showSalaryBreakdown: settings.showSalaryBreakdown
      },
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @desc    Create Razorpay order for wallet recharge
 * @route   POST /api/wallet/create-order
 * @access  Private
 */
router.post('/create-order',
  authenticate,
  [body('amount').isNumeric().withMessage('Valid amount is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { amount, targetUserId } = req.body;
      const amountInPaise = Math.round(amount * 100);

      let employee = await Employee.findOne({ userId: targetUserId || req.user.id });
      if (!employee) {
        const targetUser = await User.findById(targetUserId || req.user.id);
        if (!targetUser) {
           return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        employee = new Employee({
          userId: targetUser._id,
          name: targetUser.name,
          phone: targetUser.phone || 'N/A',
          walletBalance: 0,
          salaryWallet: 0,
          role: targetUser.role === 'employee' ? 'PE' : targetUser.role
        });
        await employee.save();
      }

      const razorpay = await getRazorpayInstance();
      if (!razorpay) {
        return res.status(500).json({ success: false, error: 'Payment gateway not configured' });
      }

      const orderOptions = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `wallet_rc_${Date.now()}_${req.user.id.toString().slice(-6)}`,
        notes: {
          userId: req.body.targetUserId || req.user.id,
          initiatorId: req.user.id,
          employeeId: employee._id.toString(),
          type: 'wallet_recharge'
        }
      };

      const order = await razorpay.orders.create(orderOptions);

      // Create a PENDING transaction in our DB (Robustness Stage 1)
      await Transaction.create({
        userId: req.body.targetUserId || req.user.id,
        employeeId: employee._id,
        amount: amount,
        type: 'CREDIT_ONLINE',
        status: 'PENDING',
        razorpay_order_id: order.id,
        remarks: req.body.targetUserId ? `Admin online recharge for employee` : 'Wallet recharge initiated',
        adminId: req.body.targetUserId ? req.user.id : undefined
      });

      const keyId = await getRazorpayKeyId();

      res.json({
        success: true,
        data: {
          orderId: order.id,
          amount: amountInPaise,
          currency: 'INR',
          keyId
        }
      });
    } catch (error) {
      console.error('Create Wallet Order Error:', error);
      res.status(500).json({ success: false, error: 'Failed to initiate recharge' });
    }
  }
);

/**
 * @desc    Verify Razorpay payment and credit wallet
 * @route   POST /api/wallet/verify-payment
 * @access  Private
 */
router.post('/verify-payment',
  authenticate,
  [
    body('razorpay_order_id').notEmpty(),
    body('razorpay_payment_id').notEmpty(),
    body('razorpay_signature').notEmpty()
  ],
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      // 1. Idempotency Check (Robustness Stage 2)
      const existingTxn = await Transaction.findOne({ razorpay_payment_id }).session(session);
      if (existingTxn && existingTxn.status === 'SUCCESS') {
        await session.commitTransaction();
        return res.json({ success: true, message: 'Payment already processed' });
      }

      // 2. Signature Verification (Robustness Stage 2)
      const credentials = await getRazorpayCredentials();
      const hmac = crypto.createHmac('sha256', credentials.keySecret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generated_signature = hmac.digest('hex');

      if (generated_signature !== razorpay_signature) {
        throw new Error('Invalid payment signature');
      }

      // 3. Find our pending transaction
      const txn = await Transaction.findOne({ razorpay_order_id }).session(session);
      if (!txn) {
        throw new Error('Transaction record not found');
      }

      if (txn.status === 'SUCCESS') {
        await session.commitTransaction();
        return res.json({ success: true, message: 'Balance already credited' });
      }

      // 4. Atomic Update (Robustness Stage 3)
      txn.status = 'SUCCESS';
      txn.razorpay_payment_id = razorpay_payment_id;
      txn.razorpay_signature = razorpay_signature;
      txn.remarks = txn.adminId ? 'Wallet recharged successfully via Razorpay (Admin Initiated)' : 'Wallet recharged successfully via Razorpay';
      await txn.save({ session });

      await Employee.findOneAndUpdate(
        { userId: txn.userId }, // Credit the target user (from transaction record)
        { $inc: { walletBalance: txn.amount } },
        { session, new: true }
      );

      await session.commitTransaction();
      res.json({ success: true, message: 'Wallet recharged successfully' });

    } catch (error) {
      await session.abortTransaction();
      console.error('Verify Wallet Payment Error:', error);
      res.status(400).json({ success: false, error: error.message || 'Payment verification failed' });
    } finally {
      session.endSession();
    }
  }
);

/**
 * @desc    Razorpay Webhook for async payment verification
 * @route   POST /api/wallet/webhook
 * @access  Public (Verified by signature)
 */
router.post('/webhook', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = await getWebhookSecret();

    if (!secret || !signature) {
      await session.abortTransaction();
      return res.status(400).send('Missing signature or secret');
    }

    // Verify signature using rawBody which is set in server.js
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      await session.abortTransaction();
      return res.status(400).send('Invalid signature');
    }

    // Payload is verified, parse it
    const payload = req.body;

    // Handle payment.captured event
    if (payload.event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const razorpay_order_id = paymentEntity.order_id;
      const razorpay_payment_id = paymentEntity.id;

      if (!razorpay_order_id) {
        await session.abortTransaction();
        return res.status(200).send('No order ID'); // Return 200 so it doesn't retry
      }

      // 1. Find pending transaction
      const txn = await Transaction.findOne({ razorpay_order_id }).session(session);
      
      // If no txn or already success, just ignore and return 200 OK
      if (!txn || txn.status === 'SUCCESS') {
        await session.abortTransaction();
        return res.status(200).send('OK');
      }

      // 2. Atomic Update (Robustness Stage 3)
      txn.status = 'SUCCESS';
      txn.razorpay_payment_id = razorpay_payment_id;
      txn.razorpay_signature = signature; 
      txn.remarks = txn.adminId ? 'Wallet recharged successfully via Webhook (Admin)' : 'Wallet recharged successfully via Webhook';
      await txn.save({ session });

      await Employee.findOneAndUpdate(
        { userId: txn.userId }, // Credit the target user (from transaction record)
        { $inc: { walletBalance: txn.amount } },
        { session, new: true }
      );

      await session.commitTransaction();
      console.log(`Webhook: Successfully credited wallet for order ${razorpay_order_id}`);
      return res.status(200).json({ status: 'ok' });
    }

    await session.abortTransaction();
    res.status(200).send('Event not handled');
  } catch (error) {
    await session.abortTransaction();
    console.error('Razorpay Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Admin manual recharge for employee
 * @route   POST /api/wallet/admin-recharge
 * @access  Admin Only
 */
router.post('/admin-recharge',
  authenticate,
  authorize(['admin', 'superadmin', 'staff']),
  [
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('amount').isNumeric().withMessage('Valid amount is required'),
    body('remarks').notEmpty().withMessage('Remarks are required')
  ],
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { employeeId, amount, remarks } = req.body;

      const targetUserId = employeeId; // frontend passes user _id
      let employee = await Employee.findOne({ $or: [{ _id: targetUserId }, { userId: targetUserId }] }).session(session);
      
      if (!employee) {
        const targetUser = await User.findById(targetUserId).session(session);
        if (!targetUser) {
          throw new Error('User not found');
        }
        
        employee = new Employee({
          userId: targetUser._id,
          name: targetUser.name,
          phone: targetUser.phone || 'N/A',
          walletBalance: 0,
          salaryWallet: 0,
          role: targetUser.role === 'employee' ? 'PE' : targetUser.role
        });
        await employee.save({ session });
      }

      // Create Admin Credit Transaction
      await Transaction.create([{
        userId: employee.userId,
        employeeId: employee._id,
        amount: amount,
        type: 'CREDIT_ADMIN',
        status: 'SUCCESS',
        remarks: remarks || 'Admin manual recharge',
        adminId: req.user.id
      }], { session });

      // Update Employee Balance
      await Employee.findByIdAndUpdate(
        employeeId,
        { $inc: { walletBalance: amount } },
        { session }
      );

      await session.commitTransaction();
      res.json({ success: true, message: `Successfully recharged ₹${amount} for ${employee.name}` });

    } catch (error) {
      await session.abortTransaction();
      console.error('Admin Recharge Error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to recharge wallet' });
    } finally {
      session.endSession();
    }
  }
);

/**
 * @desc    Admin manual deduct for employee
 * @route   POST /api/wallet/admin-deduct
 * @access  Admin Only
 */
router.post('/admin-deduct',
  authenticate,
  authorize(['admin', 'superadmin', 'staff']),
  [
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('amount').isNumeric().withMessage('Valid amount is required'),
    body('remarks').notEmpty().withMessage('Remarks are required')
  ],
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { employeeId, amount, remarks } = req.body;

      const targetUserId = employeeId;
      const employee = await Employee.findOne({ $or: [{ _id: targetUserId }, { userId: targetUserId }] }).session(session);
      
      if (!employee) {
        throw new Error('Employee record not found');
      }

      if ((employee.walletBalance || 0) < amount) {
        throw new Error('Insufficient wallet balance to deduct');
      }

      // Create Admin Debit Transaction
      await Transaction.create([{
        userId: employee.userId,
        employeeId: employee._id,
        amount: amount,
        type: 'DEBIT_SYSTEM',
        status: 'SUCCESS',
        remarks: remarks || 'Admin manual deduction',
        adminId: req.user.id
      }], { session });

      // Update Employee Balance
      await Employee.findByIdAndUpdate(
        employee._id,
        { $inc: { walletBalance: -amount } },
        { session }
      );

      await session.commitTransaction();
      res.json({ success: true, message: `Successfully deducted ₹${amount} from ${employee.name}` });

    } catch (error) {
      await session.abortTransaction();
      console.error('Admin Deduct Error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to deduct wallet' });
    } finally {
      session.endSession();
    }
  }
);

/**
 * @desc    Get all employees for admin wallet management
 * @route   GET /api/wallet/admin/employees
 * @access  Admin Only
 */
router.get('/admin/employees',
  authenticate,
  authorize(['admin', 'superadmin', 'staff']),
  async (req, res) => {
    try {
      const { search, role, state, district, block, panchayat, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Fetch user IDs of candidates who paid MOU fees (regular employees)
      const paidApps = await Application.find({ mouStatus: "paid" }).select("createdBy");
      const paidUserIds = paidApps.map(app => app.createdBy);

      // 1. Start from Employee collection (Primary source for 800+ records)
      const pipeline = [
        // Join with User
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userData'
          }
        },
        { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },

        // Union with Users who have role 'employee' but NO employee record yet
        {
          $unionWith: {
            coll: 'users',
            pipeline: [
              { $match: { role: 'employee' } },
              {
                $lookup: {
                  from: 'employees',
                  localField: '_id',
                  foreignField: 'userId',
                  as: 'empExists'
                }
              },
              { $match: { empExists: { $size: 0 } } },
              {
                $project: {
                  _id: 0,
                  userId: '$_id',
                  userData: '$$ROOT',
                  // Map User fields to Employee-like structure for consistency
                  name: null,
                  role: 'EMPLOYEE',
                  designation: null,
                  walletBalance: { $literal: 0 },
                  phone: '$phone'
                }
              }
            ]
          }
        },

        // Lookup Application (for Name fallback)
        {
          $lookup: {
            from: 'applications',
            localField: 'userId',
            foreignField: 'createdBy',
            as: 'application'
          }
        },
        {
          $addFields: {
            application: { $arrayElemAt: ['$application', 0] }
          }
        },

        // Lookup JobPosting for Post Name
        {
          $lookup: {
            from: 'jobpostings',
            let: { appId: '$application.jobPostingId', empId: '$jobPostingId' },
            pipeline: [
              { $match: { $expr: { $or: [{ $eq: ['$_id', '$$appId'] }, { $eq: ['$_id', '$$empId'] }] } } }
            ],
            as: 'jobData'
          }
        },
        {
          $addFields: {
            job: { $arrayElemAt: ['$jobData', 0] }
          }
        },

        // Lookup Block
        {
          $lookup: {
            from: 'blocks',
            localField: 'workingBlock',
            foreignField: '_id',
            as: 'blockData'
          }
        },
        
        // Lookup Panchayat
        {
          $lookup: {
            from: 'panchayats',
            localField: 'workingPanchayat',
            foreignField: '_id',
            as: 'panchayatData'
          }
        },

        // Consolidate Fields for Filtering and Display
        {
          $addFields: {
            finalName: { $ifNull: ['$name', '$application.candidateName', 'Incomplete Profile'] },
            finalRole: { $ifNull: ['$role', 'EMPLOYEE'] },
            finalDesignation: {
              $cond: {
                if: { $eq: [{ $ifNull: ['$role', 'EMPLOYEE'] }, 'PM'] },
                then: 'Project Manager ( PM )',
                else: {
                  $cond: {
                    if: { $eq: [{ $ifNull: ['$role', 'EMPLOYEE'] }, 'RM'] },
                    then: 'Regional Manager ( RM )',
                    else: {
                      $cond: {
                        if: { $eq: [{ $ifNull: ['$role', 'EMPLOYEE'] }, 'ZC'] },
                        then: 'Zonal Coordinator',
                        else: {
                          $ifNull: [
                            '$designation',
                            '$job.post.en',
                            'General Employee'
                          ]
                        }
                      }
                    }
                  }
                }
              }
            },
            finalState: { $ifNull: ['$workingState', '$state', '$application.state', ''] },
            finalDistrict: { $ifNull: ['$workingDistrict', '$district', '$application.district', 'NOT ASSIGNED'] },
            finalBlockName: { $ifNull: [{ $arrayElemAt: ['$blockData.name', 0] }, '$application.block', ''] },
            finalPanchayatName: { $ifNull: [{ $arrayElemAt: ['$panchayatData.name', 0] }, '$application.panchayat', ''] },
            finalBalance: { $ifNull: ['$walletBalance', 0] },
            finalPhone: { $ifNull: ['$phone', '$userData.phone', '$application.mobile'] },
            finalEmail: { $ifNull: ['$email', '$userData.email', '$application.email'] },
            finalStatus: {
              $cond: {
                if: {
                  $and: [
                    { $gt: [{ $type: '$_id' }, 'missing'] },
                    { $eq: ['$onboardingComplete', true] }
                  ]
                },
                then: 'Active',
                else: 'Onboarding'
              }
            },
            finalAccountStatus: { $ifNull: ['$status', 'Active'] },
            finalSalaryWallet: { $ifNull: ['$salaryWallet', 0] },
            finalAccountHolderName: { $ifNull: ['$accountHolderName', '$application.accountHolderName', ''] },
            finalBankName: { $ifNull: ['$bankName', '$application.bankName', ''] },
            finalAccountNumber: { $ifNull: ['$accountNumber', '$application.accountNumber', ''] },
            finalIfscCode: { $ifNull: ['$ifscCode', '$application.ifscCode', ''] },
            finalEmpType: {
              $cond: {
                if: {
                  $gte: [
                    { $ifNull: ['$application.mouPaidAt', '$createdAt', '$userData.createdAt', { $toDate: '$_id' }] },
                    new Date('2026-07-01T00:00:00Z')
                  ]
                },
                then: 'New',
                else: 'Old'
              }
            }
          }
        }
      ];

      // 2. Apply Search Filter
      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { finalName: { $regex: search, $options: 'i' } },
              { finalPhone: { $regex: search, $options: 'i' } },
              { finalEmail: { $regex: search, $options: 'i' } }
            ]
          }
        });
      }

      const isManualOnly = req.query.manualOnly === 'true';
      if (isManualOnly) {
        pipeline.push({ 
          $match: { 
            _id: { $exists: true, $ne: null },
            userId: { $nin: paidUserIds }
          } 
        });
      }

      // 3. Apply Role Filter (Smart Filter: Checks both short code and full designation name)
      if (role && role !== 'all') {
        const roleUpper = role.toUpperCase();
        if (roleUpper === 'EMPLOYEE') {
          if (!isManualOnly) {
            pipeline.push({ 
              $match: { 
                _id: { $exists: true, $ne: null },
                userId: { $nin: paidUserIds }
              } 
            });
          }
        } else if (roleUpper === 'DM') {
          pipeline.push({
            $match: {
              $or: [
                { finalRole: 'DM' },
                { finalDesignation: { $regex: 'District Manager', $options: 'i' } }
              ]
            }
          });
        } else if (roleUpper === 'BS') {
          pipeline.push({
            $match: {
              $or: [
                { finalRole: 'BS' },
                { finalDesignation: { $regex: 'Block Supervisor', $options: 'i' } }
              ]
            }
          });
        } else if (roleUpper === 'PE') {
          pipeline.push({
            $match: {
              $and: [
                {
                  $or: [
                    { finalRole: 'PE' },
                    { finalDesignation: { $regex: 'Panchayat Executive', $options: 'i' } }
                  ]
                },
                { finalDesignation: { $not: /Block Supervisor/i } }
              ]
            }
          });
        } else {
          pipeline.push({ $match: { finalRole: roleUpper } });
        }
      }

      // 4. Apply Location Filters
      if (state && state !== "all") {
        pipeline.push({
          $match: { finalState: { $regex: new RegExp(`^${state.split('/')[0].trim()}`, "i") } }
        });
      }
      if (district && district !== "all") {
        pipeline.push({
          $match: { finalDistrict: { $regex: new RegExp(district, "i") } }
        });
      }
      if (block && block !== "all") {
        pipeline.push({
          $match: { finalBlockName: { $regex: new RegExp(`^${block}$`, "i") } }
        });
      }
      if (panchayat && panchayat !== "all") {
        pipeline.push({
          $match: { finalPanchayatName: { $regex: new RegExp(`^${panchayat}$`, "i") } }
        });
      }

      // 5. Get Total Count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Employee.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      // 5. Apply Pagination and Sorting
      pipeline.push({ $sort: { finalName: 1 } });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limitNum });

      // 6. Calculate Gross Month Earnings for the paginated results
      const { dateRange, startDate, endDate } = req.query;
      let dateFilterQuery = null;
      
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      
      if (dateRange && dateRange !== "all") {
        if (dateRange === "today") {
          dateFilterQuery = { $gte: startOfDay };
        } else if (dateRange === "yesterday") {
          const startOfYesterday = new Date(startOfDay);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          const endOfYesterday = new Date(startOfDay);
          endOfYesterday.setMilliseconds(endOfYesterday.getMilliseconds() - 1);
          dateFilterQuery = { $gte: startOfYesterday, $lte: endOfYesterday };
        } else if (dateRange === "last7days") {
          const last7Days = new Date(startOfDay);
          last7Days.setDate(last7Days.getDate() - 6);
          dateFilterQuery = { $gte: last7Days };
        } else if (dateRange === "last30days") {
          const last30Days = new Date(startOfDay);
          last30Days.setDate(last30Days.getDate() - 29);
          dateFilterQuery = { $gte: last30Days };
        } else if (dateRange === "thisMonth") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilterQuery = { $gte: startOfMonth };
        } else if (dateRange === "pastMonth") {
          const startOfPastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfPastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilterQuery = { $gte: startOfPastMonth, $lt: endOfPastMonth };
        } else if (dateRange === "custom_date" && startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          dateFilterQuery = { $gte: start, $lte: end };
        }
      } else if (!dateRange) {
        // Default to this month if no filter is applied
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilterQuery = { $gte: startOfMonth };
      }

      const matchStage = {
        $expr: { $eq: ['$userId', '$$uId'] },
        type: { $in: ['CREDIT_COMMISSION', 'CREDIT_LEAD'] },
        status: 'SUCCESS'
      };
      
      if (dateFilterQuery) {
        matchStage.createdAt = dateFilterQuery;
      }

      pipeline.push({
        $lookup: {
          from: 'transactions',
          let: { uId: '$userId' },
          pipeline: [
            {
              $match: matchStage
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ],
          as: 'monthTransactions'
        }
      });
      
      // Calculate lifetime gross earnings (no date filter)
      pipeline.push({
        $lookup: {
          from: 'transactions',
          let: { uId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$uId'] },
                type: { $in: ['CREDIT_COMMISSION', 'CREDIT_LEAD'] },
                status: 'SUCCESS'
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ],
          as: 'lifetimeTransactions'
        }
      });

      pipeline.push({
        $addFields: {
          grossMonthEarnings: {
            $ifNull: [{ $arrayElemAt: ['$monthTransactions.total', 0] }, 0]
          },
          grossEarnings: {
            $ifNull: [{ $arrayElemAt: ['$lifetimeTransactions.total', 0] }, 0]
          }
        }
      });

      const results = await Employee.aggregate(pipeline);

      // Map back to expected frontend format
      const formattedData = results.map(item => ({
        _id: item._id || item.userId,
        employeeRecordId: item._id || null,
        userId: item.userId || item._id,
        name: item.finalName,
        role: item.finalRole,
        designation: item.finalDesignation,
        walletBalance: item.finalBalance,
        workingState: item.finalState,
        workingDistrict: item.finalDistrict,
        workingBlock: item.finalBlockName,
        workingPanchayat: item.finalPanchayatName,
        phone: item.finalPhone,
        mobile: item.finalPhone,
        email: item.finalEmail,
        status: item.finalStatus,
        accountStatus: item.finalAccountStatus || 'Active',
        salaryWallet: item.finalSalaryWallet || 0,
        grossMonthEarnings: item.grossMonthEarnings || 0,
        grossEarnings: item.grossEarnings || 0,
        accountHolderName: item.finalAccountHolderName,
        bankName: item.finalBankName,
        accountNumber: item.finalAccountNumber,
        ifscCode: item.finalIfscCode,
        bankAccountNo: item.finalAccountNumber,
        finalEmpType: item.finalEmpType
      }));

      res.json({
        success: true,
        data: formattedData,
        pagination: {
          total,
          pages: Math.ceil(total / limitNum),
          currentPage: parseInt(page),
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('Admin Unified Robust Get Employees Error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * @desc    Export filtered employees to Excel
 * @route   GET /api/wallet/admin/employees/export-csv
 * @access  Admin Only
 */
router.get('/admin/employees/export-csv',
  authenticate,
  authorize(['admin', 'superadmin', 'staff']),
  async (req, res) => {
    try {
      const { search, role, state, district, block, panchayat, filterType } = req.query;

      // Fetch user IDs of candidates who paid MOU fees (regular employees)
      const paidApps = await Application.find({ mouStatus: "paid" }).select("createdBy");
      const paidUserIds = paidApps.map(app => app.createdBy);

      // 1. Start from Employee collection
      const pipeline = [
        // Join with User
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userData'
          }
        },
        { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },

        // Union with Users who have role 'employee' but NO employee record yet
        {
          $unionWith: {
            coll: 'users',
            pipeline: [
              { $match: { role: 'employee' } },
              {
                $lookup: {
                  from: 'employees',
                  localField: '_id',
                  foreignField: 'userId',
                  as: 'empExists'
                }
              },
              { $match: { empExists: { $size: 0 } } },
              {
                $project: {
                  _id: 0,
                  userId: '$_id',
                  userData: '$$ROOT',
                  // Map User fields to Employee-like structure for consistency
                  name: null,
                  role: 'EMPLOYEE',
                  designation: null,
                  walletBalance: { $literal: 0 },
                  phone: '$phone'
                }
              }
            ]
          }
        },

        // Lookup Application (for Name fallback)
        {
          $lookup: {
            from: 'applications',
            localField: 'userId',
            foreignField: 'createdBy',
            as: 'application'
          }
        },
        {
          $addFields: {
            application: { $arrayElemAt: ['$application', 0] }
          }
        },

        // Lookup JobPosting for Post Name
        {
          $lookup: {
            from: 'jobpostings',
            let: { appId: '$application.jobPostingId', empId: '$jobPostingId' },
            pipeline: [
              { $match: { $expr: { $or: [{ $eq: ['$_id', '$$appId'] }, { $eq: ['$_id', '$$empId'] }] } } }
            ],
            as: 'jobData'
          }
        },
        {
          $addFields: {
            job: { $arrayElemAt: ['$jobData', 0] }
          }
        },

        // Lookup Block
        {
          $lookup: {
            from: 'blocks',
            localField: 'workingBlock',
            foreignField: '_id',
            as: 'blockData'
          }
        },
        
        // Lookup Panchayat
        {
          $lookup: {
            from: 'panchayats',
            localField: 'workingPanchayat',
            foreignField: '_id',
            as: 'panchayatData'
          }
        },

        // Consolidate Fields for Filtering and Display
        {
          $addFields: {
            finalName: { $ifNull: ['$name', '$application.candidateName', 'Incomplete Profile'] },
            finalRole: { $ifNull: ['$role', 'EMPLOYEE'] },
            finalDesignation: {
              $cond: {
                if: { $eq: [{ $ifNull: ['$role', 'EMPLOYEE'] }, 'PM'] },
                then: 'Project Manager ( PM )',
                else: {
                  $cond: {
                    if: { $eq: [{ $ifNull: ['$role', 'EMPLOYEE'] }, 'RM'] },
                    then: 'Regional Manager ( RM )',
                    else: {
                      $cond: {
                        if: { $eq: [{ $ifNull: ['$role', 'EMPLOYEE'] }, 'ZC'] },
                        then: 'Zonal Coordinator',
                        else: {
                          $ifNull: [
                            '$designation',
                            '$job.post.en',
                            'General Employee'
                          ]
                        }
                      }
                    }
                  }
                }
              }
            },
            finalState: { $ifNull: ['$workingState', '$state', '$application.state', ''] },
            finalDistrict: { $ifNull: ['$workingDistrict', '$district', '$application.district', 'NOT ASSIGNED'] },
            finalBlockName: { $ifNull: [{ $arrayElemAt: ['$blockData.name', 0] }, '$application.block', ''] },
            finalPanchayatName: { $ifNull: [{ $arrayElemAt: ['$panchayatData.name', 0] }, '$application.panchayat', ''] },
            finalBalance: { $ifNull: ['$walletBalance', 0] },
            finalPhone: { $ifNull: ['$phone', '$userData.phone', '$application.mobile'] },
            finalEmail: { $ifNull: ['$email', '$userData.email', '$application.email'] },
            finalStatus: {
              $cond: {
                if: {
                  $and: [
                    { $gt: [{ $type: '$_id' }, 'missing'] },
                    { $eq: ['$onboardingComplete', true] }
                  ]
                },
                then: 'Active',
                else: 'Onboarding'
              }
            },
            finalAccountStatus: { $ifNull: ['$status', 'Active'] }
          }
        }
      ];

      // 2. Apply Search Filter
      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { finalName: { $regex: search, $options: 'i' } },
              { finalPhone: { $regex: search, $options: 'i' } },
              { finalEmail: { $regex: search, $options: 'i' } }
            ]
          }
        });
      }

      const isManualOnly = req.query.manualOnly === 'true';
      if (isManualOnly) {
        pipeline.push({ 
          $match: { 
            _id: { $exists: true, $ne: null },
            userId: { $nin: paidUserIds }
          } 
        });
      }

      // 3. Apply Role Filter
      if (role && role !== 'all') {
        const roleUpper = role.toUpperCase();
        if (roleUpper === 'EMPLOYEE') {
          if (!isManualOnly) {
            pipeline.push({ 
              $match: { 
                _id: { $exists: true, $ne: null },
                userId: { $nin: paidUserIds }
              } 
            });
          }
        } else if (roleUpper === 'DM') {
          pipeline.push({
            $match: {
              $or: [
                { finalRole: 'DM' },
                { finalDesignation: { $regex: 'District Manager', $options: 'i' } }
              ]
            }
          });
        } else if (roleUpper === 'BS') {
          pipeline.push({
            $match: {
              $or: [
                { finalRole: 'BS' },
                { finalDesignation: { $regex: 'Block Supervisor', $options: 'i' } }
              ]
            }
          });
        } else if (roleUpper === 'PE') {
          pipeline.push({
            $match: {
              $and: [
                {
                  $or: [
                    { finalRole: 'PE' },
                    { finalDesignation: { $regex: 'Panchayat Executive', $options: 'i' } }
                  ]
                },
                { finalDesignation: { $not: /Block Supervisor/i } }
              ]
            }
          });
        } else {
          pipeline.push({ $match: { finalRole: roleUpper } });
        }
      }

      // 4. Apply Location Filters
      if (state && state !== "all") {
        pipeline.push({
          $match: { finalState: { $regex: new RegExp(`^${state.split('/')[0].trim()}`, "i") } }
        });
      }
      if (district && district !== "all") {
        pipeline.push({
          $match: { finalDistrict: { $regex: new RegExp(district, "i") } }
        });
      }
      if (block && block !== "all") {
        pipeline.push({
          $match: { finalBlockName: { $regex: new RegExp(`^${block}$`, "i") } }
        });
      }
      if (panchayat && panchayat !== "all") {
        pipeline.push({
          $match: { finalPanchayatName: { $regex: new RegExp(`^${panchayat}$`, "i") } }
        });
      }

      if (filterType === 'locked') {
        pipeline.push({ $match: { isZoneLocked: true } });
      } else if (filterType === 'unlocked') {
        pipeline.push({ $match: { isZoneLocked: { $ne: true } } });
      }

      pipeline.push({ $sort: { finalName: 1 } });

      const results = await Employee.aggregate(pipeline);

      const exportData = results.map(item => ({
        "Name": item.finalName || "N/A",
        "Email": item.finalEmail || "N/A",
        "Phone": item.finalPhone || "N/A",
        "Designation": item.finalDesignation || "N/A",
        "State": item.finalState || "N/A",
        "District": item.finalDistrict || "N/A",
        "Block": item.finalBlockName || "N/A",
        "Panchayat": item.finalPanchayatName || "N/A",
        "Wallet Balance": item.finalBalance || 0,
        "Account Status": item.finalAccountStatus || "Active",
        "Onboarding Status": item.finalStatus || "Onboarding"
      }));

      if (exportData.length === 0) {
        exportData.push({ "Message": "No data found matching the filters." });
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 25 },
        { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Employees");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Disposition", 'attachment; filename="employees_list.xlsx"');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(buffer);
    } catch (error) {
      console.error('Export Employees CSV Error:', error);
      res.status(500).json({ success: false, error: 'Internal server error during export' });
    }
  }
);

/**
 * @desc    Get canonical post list (always exactly 3 — DM, BS, PE)
 *          normalized from actual DB designations/roles
 * @route   GET /api/wallet/post-list
 * @access  Admin Only
 */
router.get('/post-list',
  authenticate,
  authorize(['admin', 'superadmin', 'staff']),
  async (req, res) => {
    try {
      // The 3 canonical posts we support — in display order
      const CANONICAL_POSTS = [
        'District Manager',
        'Block Supervisor',
        'Panchayat Executive',
      ];

      // Normalize any designation to a canonical post name
      const normalize = (val = '') => {
        const v = val.toLowerCase();
        if (v.includes('district manager')) return 'District Manager';
        if (v.includes('block supervisor')) return 'Block Supervisor'; // also catches "Block Supervisor cum ..."
        if (v.includes('panchayat executive')) return 'Panchayat Executive';
        return null;
      };

      // Collect all designations + role codes from DB
      const [designations, roles] = await Promise.all([
        Employee.distinct('designation', { designation: { $exists: true, $ne: '' } }),
        Employee.distinct('role',        { role:        { $exists: true, $ne: '' } }),
      ]);

      const roleMap = { DM: 'District Manager', BS: 'Block Supervisor', PE: 'Panchayat Executive' };

      // Build set of canonical posts that actually have employees
      const found = new Set();
      [...designations, ...roles.map(r => roleMap[r] || r)].forEach(v => {
        const canonical = normalize(v);
        if (canonical) found.add(canonical);
      });

      // Return only canonical posts that exist in DB, in fixed order
      const posts = CANONICAL_POSTS.filter(p => found.has(p));

      res.json({ success: true, data: posts });
    } catch (error) {
      console.error('Get Post List Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch post list' });
    }
  }
);

/**
 * @desc    Check Razorpay order status dynamically
 * @route   GET /api/wallet/admin/transactions/:id/razorpay-status
 * @access  Admin Only
 */
router.get('/admin/transactions/:id/razorpay-status',
  authenticate,
  authorize(['admin', 'superadmin', 'staff']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const txn = await Transaction.findById(id);
      if (!txn) return res.status(404).json({ success: false, error: 'Transaction not found' });
      if (!txn.razorpay_order_id || txn.razorpay_order_id === 'MANUAL') {
        return res.status(400).json({ success: false, error: 'No Razorpay order ID found' });
      }
      
      const razorpay = await getRazorpayInstance();
      if (!razorpay) return res.status(500).json({ success: false, error: 'Razorpay is not configured' });
      
      const order = await razorpay.orders.fetch(txn.razorpay_order_id);
      const payments = await razorpay.orders.fetchPayments(txn.razorpay_order_id);
      
      let paymentStatus = 'N/A';
      let failureReason = null;

      if (payments && payments.items && payments.items.length > 0) {
        // Razorpay returns items in chronological order usually, so we can check the latest or if any is captured
        const captured = payments.items.find(p => p.status === 'captured');
        const authorized = payments.items.find(p => p.status === 'authorized');
        const failed = payments.items.find(p => p.status === 'failed');
        
        if (captured) paymentStatus = 'captured';
        else if (authorized) paymentStatus = 'authorized';
        else if (failed) {
          paymentStatus = 'failed';
          failureReason = failed.error_description || failed.error_reason || failed.error_message || "Unknown error";
        }
        else {
          paymentStatus = payments.items[0].status;
          failureReason = payments.items[0].error_description || payments.items[0].error_reason || null;
        }
      } else {
        failureReason = "User didn't attempt payment (e.g., closed the payment window without paying)";
      }
      
      res.json({ success: true, data: { orderStatus: order.status, paymentStatus, failureReason } });
    } catch (error) {
      console.error("Razorpay Status Error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch Razorpay status" });
    }
  }
);


/**
 * @desc    Global recharge — credit amount to ALL employees of a selected post
 * @route   POST /api/wallet/global-recharge
 * @access  Admin Only
 */
router.post('/global-recharge',
  authenticate,
  authorize(['admin', 'superadmin', 'staff']),
  [
    body('post').notEmpty().withMessage('Post selection is required'),
    body('amount').isNumeric({ min: 1 }).withMessage('Valid amount is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { post, amount, remarks } = req.body;
      const creditAmount = parseFloat(amount);

      // --- Exclusive match queries per canonical post ---
      // "Block Supervisor cum Panchayat Executive" → ONLY goes to Block Supervisor, NOT PE
      let matchQuery;

      if (post === 'District Manager') {
        matchQuery = {
          $or: [
            { role: 'DM' },
            { designation: { $regex: 'district manager', $options: 'i' } }
          ]
        };
      } else if (post === 'Block Supervisor') {
        // Matches "Block Supervisor" AND "Block Supervisor cum Panchayat Executive"
        matchQuery = {
          $or: [
            { role: 'BS' },
            { designation: { $regex: 'block supervisor', $options: 'i' } }
          ]
        };
      } else if (post === 'Panchayat Executive') {
        // Must contain "panchayat executive" but must NOT contain "block supervisor"
        // (to exclude "Block Supervisor cum Panchayat Executive")
        matchQuery = {
          $and: [
            {
              $or: [
                { role: 'PE' },
                { designation: { $regex: 'panchayat executive', $options: 'i' } }
              ]
            },
            { designation: { $not: /block supervisor/i } }
          ]
        };
      } else {
        return res.status(400).json({ success: false, error: `Unknown post: ${post}` });
      }

      // --- Employee Type (Old/New/All) and Safety Filter ---
      const { empType } = req.body;
      const Application = mongoose.model("Application");
      const User = mongoose.model("User");

      // 1. Fetch all basic matching employees for the post
      let employees = await Employee.find(matchQuery).select('_id userId createdAt onboardingComplete');

      if (employees.length === 0) {
        return res.status(404).json({ success: false, error: `No employees found for post: ${post}` });
      }

      // 2. Filter in JS using exact same date logic as the frontend table
      const userIds = employees.map(e => e.userId);
      const apps = await Application.find({ createdBy: { $in: userIds } }).select("createdBy mouPaidAt");
      const users = await User.find({ _id: { $in: userIds } }).select("_id createdAt");
      const targetDate = new Date('2026-07-01T00:00:00Z');

      employees = employees.filter(emp => {
        const app = apps.find(a => a.createdBy.toString() === emp.userId.toString());
        const user = users.find(u => u._id.toString() === emp.userId.toString());

        // Safety Filter: Exclude manual employees who are still "Onboarding"
        if (!app?.mouPaidAt && emp.onboardingComplete === false) {
          return false;
        }

        if (empType && empType !== "All") {
          // Compute Date priority exactly like $ifNull in table pipeline
          const empDate = (app && app.mouPaidAt) ? app.mouPaidAt :
                          (emp.createdAt) ? emp.createdAt :
                          (user && user.createdAt) ? user.createdAt :
                          emp._id.getTimestamp();

          const isNew = empDate >= targetDate;
          
          if (empType === "New" && !isNew) return false;
          if (empType === "Old" && isNew) return false;
        }
        
        return true;
      });

      if (employees.length === 0) {
        return res.status(404).json({ success: false, error: `No valid employees found for ${post} in category ${empType}` });
      }

      if (employees.length === 0) {
        return res.status(404).json({ success: false, error: `No employees found for post: ${post}` });
      }

      const adminRemarks = remarks
        ? `JSSA Administration has provided monthly credit of ₹${creditAmount} to all ${post}s — Note: ${remarks}`
        : `JSSA Administration has provided monthly credit of ₹${creditAmount} to all ${post}s`;


      // Bulk update wallet balances
      const employeeIds = employees.map(e => e._id);
      await Employee.updateMany(
        { _id: { $in: employeeIds } },
        { $inc: { walletBalance: creditAmount } }
      );

      // Create individual transaction records for each employee
      const transactions = employees.map(emp => ({
        userId: emp.userId,
        employeeId: emp._id,
        amount: creditAmount,
        type: 'CREDIT_ADMIN',
        status: 'SUCCESS',
        remarks: adminRemarks,
        adminId: req.user.id
      }));
      await Transaction.insertMany(transactions);

      res.json({
        success: true,
        message: `Successfully credited ₹${creditAmount} to ${employees.length} ${post}s`,
        data: { creditedCount: employees.length, post, amount: creditAmount }
      });

    } catch (error) {
      console.error('Global Recharge Error:', error);
      res.status(500).json({ success: false, error: error.message || 'Global recharge failed' });
    }
  }
);

/**
 * @desc    Get all wallet transactions for admin ledger
 * @route   GET /api/wallet/admin/transactions
 * @access  Admin Only
 */
router.get('/admin/transactions',
  authenticate,
  authorize(['admin', 'superadmin', 'staff']),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const { status, search, type } = req.query;

      const pipeline = [];

      if (type === 'CREDIT_ADMIN') {
        pipeline.push({
          $match: {
            type: 'CREDIT_ADMIN'
          }
        });
      } else if (type === 'CREDIT_ONLINE') {
        pipeline.push({
          $match: {
            type: 'CREDIT_ONLINE'
          }
        });
      } else {
        // We only care about wallet transactions, not commissions by default
        pipeline.push({
          $match: {
            type: { $nin: ['CREDIT_COMMISSION', 'CREDIT_LEAD'] }
          }
        });
      }

      if (status && status !== 'ALL') {
        pipeline.push({ $match: { status } });
      }

      // Lookup User
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userData'
        }
      });
      pipeline.push({ $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } });

      // Lookup Employee
      pipeline.push({
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'empData'
        }
      });
      pipeline.push({ $unwind: { path: '$empData', preserveNullAndEmptyArrays: true } });

      // Consolidate name/phone
      pipeline.push({
        $addFields: {
          userName: { $ifNull: ['$empData.name', '$userData.name', 'Unknown'] },
          userPhone: { $ifNull: ['$empData.phone', '$userData.phone', 'Unknown'] }
        }
      });

      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { userName: { $regex: search, $options: 'i' } },
              { userPhone: { $regex: search, $options: 'i' } },
              { razorpay_order_id: { $regex: search, $options: 'i' } }
            ]
          }
        });
      }

      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Transaction.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      pipeline.push({ $sort: { createdAt: -1 } });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      const transactions = await Transaction.aggregate(pipeline);

      res.json({
        success: true,
        data: transactions,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      });
    } catch (error) {
      console.error('Admin Fetch Transactions Error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * @desc    Manually resolve a pending transaction
 * @route   POST /api/wallet/admin/transactions/:id/resolve
 * @access  Admin Only
 */
router.post('/admin/transactions/:id/resolve',
  authenticate,
  authorize(['admin', 'superadmin', 'staff']),
  [
    body('action').isIn(['SUCCESS', 'FAILED']).withMessage('Valid action is required')
  ],
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { action } = req.body;

      const txn = await Transaction.findById(id).session(session);
      if (!txn) {
        throw new Error('Transaction not found');
      }

      if (txn.status !== 'PENDING') {
        throw new Error(`Transaction is already ${txn.status}`);
      }

      txn.status = action;
      txn.remarks = `Manually marked as ${action} by Admin`;
      txn.adminId = req.user.id;
      
      await txn.save({ session });

      if (action === 'SUCCESS') {
        // Find employee associated with the transaction's userId
        const emp = await Employee.findOne({ userId: txn.userId }).session(session);
        if (emp) {
          emp.walletBalance += txn.amount;
          await emp.save({ session });
        } else {
          // Fallback if employee record doesn't exist, though it should exist for wallet recharges
          throw new Error('Associated Employee record not found');
        }
      }

      await session.commitTransaction();
      res.json({ success: true, message: `Transaction marked as ${action} successfully` });
    } catch (error) {
      await session.abortTransaction();
      console.error('Resolve Transaction Error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to resolve transaction' });
    } finally {
      session.endSession();
    }
  }
);

export default router;
