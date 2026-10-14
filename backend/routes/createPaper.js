// Create Paper Routes - Updated for Hierarchical Rescheduling
import express from "express";
import mongoose from "mongoose";
import { body, validationResult } from "express-validator";
import CreatePaper from "../models/CreatePaper.js";
import Application from "../models/Application.js";
import BroadcastJob from "../models/BroadcastJob.js";
import Student from "../models/Student.js";
import Attempt from "../models/Attempt.js";
import QuestionBank from "../models/QuestionBank.js";
import { authenticate } from "../middleware/auth.js";
import { sendExamAssignmentSMS, sendExamPassSMS } from "../utils/smsService.js";
import { sendMOUEmail, sendExamAssignmentEmail } from "../utils/emailService.js";
import { sendMOUProcessWhatsApp, sendExamAssignmentWhatsApp } from "../utils/whatsappService.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const router = express.Router();
router.use(authenticate);

const toNumberOrDefault = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toBooleanOrDefault = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const normalizePayload = (body) => ({
  ...body,
  difficulty: String(body.difficulty || "Mixed").trim(),
  duration: toNumberOrDefault(body.duration, 1),
  passingMarks: toNumberOrDefault(body.passingMarks, 0),
  maxAttempts: toNumberOrDefault(body.maxAttempts, 1),
  totalQuestions: toNumberOrDefault(body.totalQuestions, 0),
  totalMarks: toNumberOrDefault(body.totalMarks, 0),
  attempts: toNumberOrDefault(body.attempts, 0),
  avgScore: toNumberOrDefault(body.avgScore, 0),
  isPublic: toBooleanOrDefault(body.isPublic, true),
  shuffleQuestions: toBooleanOrDefault(body.shuffleQuestions, false),
  showResult: toBooleanOrDefault(body.showResult, true),
  resultDate: body.resultDate || "",
  mouStartDate: body.mouStartDate || "",
  mouEndDate: body.mouEndDate || "",
  assignedStudents: Array.isArray(body.assignedStudents) ? body.assignedStudents : [],
  startDate: body.startDate || "",
  endDate: body.endDate || "",
});

const sendAssignmentNotifications = async (studentIds, startDate, endDate) => {
  if (!studentIds || studentIds.length === 0) {
    console.log("⚠️ No students assigned, skipping SMS notifications.");
    return;
  }

  console.log(`📱 Initiating sequential notifications for ${studentIds.length} students...`);

  try {
    const students = await Application.find({ _id: { $in: studentIds } }).select("mobile candidateName applicationNumber email");
    console.log(`📱 Found ${students.length} student records for notification.`);

    const formatSmsDate = (dateStr) => {
      if (!dateStr) return "N/A";
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) { return dateStr; }
    };

    const formattedStart = formatSmsDate(startDate);
    const formattedEnd = formatSmsDate(endDate);

    for (const student of students) {
      if (student.mobile && student.mobile.length === 10) {
        try {
          await sendExamAssignmentSMS(student.mobile, formattedStart, formattedEnd);
          await sendExamAssignmentWhatsApp(student.mobile, student.applicationNumber || "N/A", formattedStart, formattedEnd);
          if (student.email) {
            await sendExamAssignmentEmail({
              to: student.email,
              candidateName: student.candidateName,
              startDate: formattedStart,
              endDate: formattedEnd
            });
          }
        } catch (err) {
          console.error(`❌ Failed to notify student ${student._id}:`, err.message);
        }
        await sleep(300);
      }
    }
  } catch (error) {
    console.error("❌ Error in sendAssignmentNotifications:", error);
  }
};

/**
 * PATCH /api/create-paper/broadcast/control/:jobId
 * Control active jobs (pause, resume, cancel)
 */
router.patch("/broadcast/control/:jobId", authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { action } = req.body; // pause, resume, cancel

    let newStatus = "processing";
    if (action === "pause") newStatus = "paused";
    if (action === "cancel") newStatus = "cancelled";
    if (action === "resume") newStatus = "processing";

    const job = await BroadcastJob.findByIdAndUpdate(
      jobId,
      { status: newStatus },
      { new: true }
    );

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/create-paper/broadcast/active
 * Get all active/pending jobs for the current user
 */
router.get("/broadcast/active", authenticate, async (req, res) => {
  try {
    const jobs = await BroadcastJob.find({
      createdBy: req.user.id,
      status: { $in: ["processing", "paused", "pending"] }
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/create-paper/broadcast/status/:jobId
 */
router.get("/broadcast/status/:jobId", authenticate, async (req, res) => {
  try {
    const job = await BroadcastJob.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/create-paper/mou/broadcast
 */
router.post("/mou/broadcast", authenticate, async (req, res) => {
  try {
    const { attemptIds, channels } = req.body;
    if (!attemptIds?.length) return res.status(400).json({ error: "No candidates selected" });

    const job = await BroadcastJob.create({
      jobType: "mou",
      title: "MOU Notifications Campaign",
      totalCandidates: attemptIds.length,
      candidateIds: attemptIds,
      channels: channels || { sms: true, email: false },
      createdBy: req.user.id,
      status: "pending"
    });

    runMOUBroadcastJob(job._id).catch(err => console.error("MOU Job Error:", err));

    res.json({ success: true, data: { jobId: job._id } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/create-paper/mou/details/:id
 * Get full MOU details by attempt ID
 */
router.get("/mou/details/:id", authenticate, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate({
        path: "applicationId",
        populate: {
          path: "jobPostingId",
          select: "title advtNo post"
        }
      })
      .populate("testId")
      .lean();

    if (!attempt) {
      return res.status(404).json({ success: false, error: "MOU details not found" });
    }

    res.json({ success: true, data: attempt });
  } catch (error) {
    console.error("Get MOU details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/create-paper/:id/broadcast
 */
router.post("/:id/broadcast", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds, channels } = req.body;
    const test = await CreatePaper.findById(id);
    if (!test) return res.status(404).json({ error: "Test not found" });

    const job = await BroadcastJob.create({
      testId: id,
      title: test.title,
      totalCandidates: studentIds?.length || 0,
      candidateIds: studentIds || [],
      channels: channels || { sms: true, email: false },
      createdBy: req.user.id,
      status: "pending"
    });

    runBroadcastJob(job._id).catch(err => console.error("Job Error:", err));
    res.json({ success: true, data: { jobId: job._id } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * Background worker for bulk notifications
 */
const runBroadcastJob = async (jobId) => {
  try {
    const job = await BroadcastJob.findById(jobId);
    if (!job) return;

    job.status = "processing";
    await job.save();

    const test = await CreatePaper.findById(job.testId);
    if (!test) {
      job.status = "failed";
      await job.save();
      return;
    }

    const students = await Application.find({ _id: { $in: job.candidateIds } })
      .select("mobile candidateName applicationNumber email");

    const formatSmsDate = (dateStr) => {
      if (!dateStr) return "N/A";
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) { return dateStr; }
    };

    const formattedStart = formatSmsDate(test.startDate);
    const formattedEnd = formatSmsDate(test.endDate);

    let sent = job.sentCount || 0;
    // Skip students that are already notified
    const remainingStudents = students.slice(sent);

    for (const student of remainingStudents) {
      // Check for pause/cancel from DB in every iteration
      let currentStatus = await BroadcastJob.findById(jobId).select("status");

      if (!currentStatus || currentStatus.status === "cancelled" || currentStatus.status === "failed") {
        console.log(`⏹️ Job ${jobId} was stopped or not found. Skipping.`);
        return;
      }

      // Handle Pause state
      while (currentStatus.status === "paused") {
        await sleep(2000);
        currentStatus = await BroadcastJob.findById(jobId).select("status");
        if (currentStatus.status === "cancelled") return;
        if (currentStatus.status !== "paused") break;
      }

      try {
        if (job.channels.sms && student.mobile && student.mobile.length === 10) {
          await sendExamAssignmentSMS(student.mobile, formattedStart, formattedEnd);
        }

        if (job.channels.email && student.email) {
          await sendExamAssignmentEmail({
            to: student.email,
            candidateName: student.candidateName,
            startDate: formattedStart,
            endDate: formattedEnd
          });
        }
        sent++;
        // Update database for EVERY message so counter is live
        await BroadcastJob.findByIdAndUpdate(jobId, { sentCount: sent });
      } catch (err) {
        console.error(`Broadcast error for ${student._id}:`, err.message);
      }
      await sleep(300);
    }

    job.status = "completed";
    job.sentCount = sent;
    job.completedAt = new Date();
    await job.save();
    console.log(`✅ Broadcast Job ${jobId} completed. Sent: ${sent}`);
  } catch (error) {
    console.error("Broadcast Job Fatal Error:", error);
    await BroadcastJob.findByIdAndUpdate(jobId, { status: "failed" });
  }
};

/**
 * BACKGROUND WORKER FOR MOU BROADCAST
 */
async function runMOUBroadcastJob(jobId) {
  try {
    const job = await BroadcastJob.findById(jobId);
    if (!job) return;

    await BroadcastJob.findByIdAndUpdate(jobId, { status: "processing" });

    // Fetch attempt details
    const attempts = await Attempt.find({ _id: { $in: job.candidateIds } })
      .populate("applicationId")
      .populate("testId")
      .lean();

    let sent = 0;
    for (const attempt of attempts) {
      // Check for pause/cancel
      let currentStatus = await BroadcastJob.findById(jobId).select("status");
      if (!currentStatus || currentStatus.status === "cancelled" || currentStatus.status === "failed") return;

      while (currentStatus.status === "paused") {
        await sleep(2000);
        currentStatus = await BroadcastJob.findById(jobId).select("status");
        if (!currentStatus || currentStatus.status === "cancelled") return;
      }

      const application = attempt.applicationId;
      const test = attempt.testId;

      if (application && application.mobile) {
        try {
          const notifications = [];
          if (job.channels.sms) {
            notifications.push(sendExamPassSMS(
              application.mobile,
              application.applicationNumber || "N/A",
              attempt.score || 0,
              test.mouStartDate || "N/A",
              test.mouEndDate || "N/A"
            ));
          }
          if (job.channels.email && application.email) {
            notifications.push(sendMOUEmail({
              to: application.email,
              candidateName: application.candidateName || "Candidate",
              applicationNo: application.applicationNumber || "N/A",
              marks: attempt.score || 0,
              mouStart: test.mouStartDate || "N/A",
              mouEnd: test.mouEndDate || "N/A"
            }));
          }
          await Promise.allSettled(notifications);

          await Attempt.findByIdAndUpdate(attempt._id, {
            notificationStatus: "Sent",
            lastNotifiedAt: new Date()
          });
          sent++;
          await BroadcastJob.findByIdAndUpdate(jobId, { sentCount: sent });
        } catch (err) {
          console.error(`MOU Notif Error for ${attempt._id}:`, err.message);
        }
      }
      await sleep(300);
    }

    await BroadcastJob.findByIdAndUpdate(jobId, { status: "completed" });
  } catch (error) {
    console.error("MOU BG Job Error:", error);
    await BroadcastJob.findByIdAndUpdate(jobId, { status: "failed" });
  }
}

/**
 * GET /api/create-paper
 * Get all tests/papers (Default: Full details for compatibility)
 * Pass ?minimal=true to get only basic exam metadata
 */
router.get("/", async (req, res) => {
  try {
    const { status, search, page = 1, limit = 100, minimal = "false" } = req.query;
    const isMinimal = minimal === "true";
    const query = {};

    if (status && status !== "all") query.status = status;
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$or = [
        { title: searchRegex },
        { subject: searchRegex },
        { type: searchRegex },
        { tags: searchRegex },
      ];

      const matchingApps = await Application.find({
        $or: [
          { candidateName: searchRegex },
          { mobile: searchRegex },
          { email: searchRegex },
        ]
      }).select("_id").lean();

      if (matchingApps.length > 0) {
        query.$or.push({ assignedStudents: { $in: matchingApps.map(app => app._id) } });
      }
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    // If limit is "0", treat as no limit (capped at 10000 for safety)
    let limitNum = parseInt(limit, 10);
    if (limit === "0") {
      limitNum = 10000;
    } else {
      limitNum = Math.min(Math.max(limitNum || 100, 1), 1000);
    }
    const skip = (pageNum - 1) * limitNum;

    // Build selection and population based on minimal flag
    let findQuery = CreatePaper.find(query)
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .skip(skip)
      .limit(limitNum);

    if (isMinimal) {
      // Return only basic metadata fields
      findQuery = findQuery.select("title class type difficulty duration passingMarks description startDate endDate isPublic shuffleQuestions showResult status createdDate createdBy totalQuestions totalMarks assignedStudents parentExamId rescheduleTarget");
      findQuery = findQuery.populate("createdBy", "email role");
    } else {
      // Full details with populations - AVOID populating assignedStudents in list view
      // Just populate creator and questions
      findQuery = findQuery.populate("createdBy", "email role")
        .populate("questionConfigs.questionId", "question questionHi marks options optionsHi _id");
    }

    const [testsRaw, total] = await Promise.all([
      findQuery.lean(),
      CreatePaper.countDocuments(query),
    ]);

    // Recalculate real-time attempts if needed
    const testIds = testsRaw.map(t => t._id);
    const attemptsCounts = await Attempt.aggregate([
      { $match: { testId: { $in: testIds } } },
      { $group: { _id: "$testId", count: { $sum: 1 } } }
    ]);

    const attemptsMap = attemptsCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const tests = testsRaw.map(test => ({
      ...test,
      id: test._id.toString(),
      attempts: attemptsMap[test._id.toString()] || 0
    }));

    res.json({
      success: true,
      data: {
        tests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get create paper list error:", error);
    res.status(500).json({
      error: "Failed to fetch tests",
      message: error.message,
    });
  }
});

/**
 * GET /api/create-paper/assigned
 * Get exams assigned to the current student
 */
router.get("/assigned", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "applicant" && req.user.role !== "employee") {
      return res.json({ success: true, data: { tests: [] } });
    }

    // Parallel lookup for applications and student record
    const [applications, student] = await Promise.all([
      Application.find({ createdBy: req.user.id }).select("_id").lean(),
      Student.findOne({ userId: req.user.id }).select("_id").lean()
    ]);

    const applicationIds = applications.map(app => app._id);
    const studentId = student ? student._id : null;

    // Find tests assigned to any of these IDs
    const tests = await CreatePaper.find({
      $or: [
        { assignedStudents: { $in: applicationIds } },
        { assignedStudents: req.user.id },
        ...(studentId ? [{ assignedStudents: studentId }] : [])
      ]
    })
      .populate({
        path: "questionConfigs.questionId",
        select: "question questionHi options optionsHi _id" // Include Hindi fields
      })
      .lean();

    // Fetch existing attempts for this user to calculate attemptsUsed
    const userAttempts = await Attempt.find({ userId: req.user.id })
      .select("testId score createdAt applicationId")
      .populate({
        path: "applicationId",
        select: "candidateName fatherName motherName dob mobile email aadhar pan address panchayat block gramPanchayat blockKhand villageTola pincode state district educationDetails nationality applicationNumber jobPostingId signature photo bankName accountHolderName accountNumber ifscCode branchName nomineeName nomineeRelation nomineeAge employeeId",
        populate: {
          path: "jobPostingId",
          select: "advtNo post title"
        }
      })
      .lean();
    const attemptData = userAttempts.reduce((acc, curr) => {
      const id = curr.testId.toString();
      if (!acc[id]) acc[id] = [];
      acc[id].push(curr);
      return acc;
    }, {});

    // Process tests to add windowStatus and canStart based on current date
    const now = new Date();
    const processedTests = tests.map(test => {
      let windowStatus = "active";
      const attempts = attemptData[test._id.toString()] || [];
      const attemptsUsed = attempts.length;
      let canStart = attemptsUsed < (test.maxAttempts || 1);

      const startDate = test.startDate ? new Date(test.startDate) : null;
      const endDate = test.endDate ? new Date(test.endDate) : null;

      if (startDate && now < startDate) {
        windowStatus = "upcoming";
        canStart = false;
      } else if (endDate) {
        const endOfDate = new Date(endDate);
        endOfDate.setHours(23, 59, 59, 999);
        if (now > endOfDate) {
          windowStatus = "ended";
          canStart = false;
        }
      }

      // Check if result can be shown
      let resultAvailable = test.showResult;
      if (!resultAvailable && test.resultDate) {
        const resDate = new Date(test.resultDate);
        if (now >= resDate) resultAvailable = true;
      }

      return {
        ...test,
        id: test._id.toString(), // Ensure frontend has 'id' field
        windowStatus,
        canStart,
        attemptsUsed,
        maxAttempts: test.maxAttempts || 1,
        shuffleQuestions: test.shuffleQuestions,
        resultDate: test.resultDate,
        resultAvailable,
        userAttempt: attempts.length > 0 ? {
          ...attempts[0],
          applicationId: attempts[0].applicationId ? {
            ...attempts[0].applicationId,
            district: attempts[0].applicationId.district || "N/A",
            educationDetails: attempts[0].applicationId.educationDetails || []
          } : null
        } : null,
        // Map questions for frontend
        questions: (test.questionConfigs || []).map(q => ({
          id: q.questionId?._id,
          question: q.questionId?.question,
          questionHi: q.questionId?.questionHi,
          options: q.questionId?.options,
          optionsHi: q.questionId?.optionsHi,
          marks: q.marks,
          isCompulsory: q.isCompulsory
        }))
      };
    });

    res.json({
      success: true,
      data: { tests: processedTests }
    });
  } catch (error) {
    console.error("Get assigned exams error:", error);
    res.status(500).json({
      error: "Failed to fetch assigned exams",
      message: error.message,
    });
  }
});

/**
 * GET /api/create-paper/details/:id
 * Get ALL details for a specific test (full population)
 */
router.get("/details/:id", async (req, res) => {
  try {
    const test = await CreatePaper.findById(req.params.id)
      .populate("createdBy", "email role")
      .populate({
        path: "assignedStudents",
        // Only fetch fields needed for DetailsView to prevent timeouts
        select: "candidateName fatherName mobile email district photo applicationNumber _id",
      })
      .populate({
        path: "questionConfigs.questionId",
        select: "question questionHi options optionsHi marks _id",
      });

    if (!test) {
      return res.status(404).json({
        success: false,
        error: "Test not found",
      });
    }

    // Convert to object to modify safely
    const testObj = test.toObject();
    testObj.id = testObj._id.toString();

    // Dynamically calculate totalQuestions and totalMarks if they are 0
    if (!testObj.totalQuestions || testObj.totalQuestions === 0) {
      testObj.totalQuestions = (testObj.questionConfigs || []).length;
    }
    if (!testObj.totalMarks || testObj.totalMarks === 0) {
      testObj.totalMarks = (testObj.questionConfigs || []).reduce(
        (sum, q) => sum + (q.marks || 0),
        0
      );
    }

    res.json({
      success: true,
      data: { test: testObj },
    });
  } catch (error) {
    console.error("Get full test details error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch full test details",
      message: error.message,
    });
  }
});

/**
 * GET /api/create-paper/:id/attempts
 * Get attempts for a specific test with pagination.
 * Now returns ALL assigned students with their status (Pass, Fail, Missed, Pending).
 */
router.get("/:id/attempts", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all" } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // 1. Get test details to know who is assigned and what the rules are
    const test = await CreatePaper.findById(req.params.id)
      .select("assignedStudents passingMarks totalMarks endDate")
      .lean();
    if (!test) return res.status(404).json({ error: "Test not found" });

    const assignedStudentIds = (test.assignedStudents || []).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const passingMarks = test.passingMarks || 40;
    const totalMarks = test.totalMarks || 100;
    const endOfDate = test.endDate ? new Date(test.endDate) : null;
    if (endOfDate) endOfDate.setHours(23, 59, 59, 999);
    const isExpired = endOfDate && endOfDate < new Date();

    // 2. Pre-filter IDs based on status if needed
    let matchingAppIds = assignedStudentIds;
    
    if (status !== "all") {
      // Find attempts to determine status efficiently
      const allAttempts = await Attempt.find({
        testId: new mongoose.Types.ObjectId(req.params.id),
        applicationId: { $in: assignedStudentIds }
      }).select("applicationId score").lean();
      
      if (status.toLowerCase() === "pass" || status.toLowerCase() === "fail") {
        if (status.toLowerCase() === "pass") {
          matchingAppIds = allAttempts.filter(a => a.score >= passingMarks).map(a => a.applicationId);
        } else {
          matchingAppIds = allAttempts.filter(a => a.score < passingMarks).map(a => a.applicationId);
        }
      } else if (status.toLowerCase() === "missed" || status.toLowerCase() === "not started") {
        const attemptedAppIdsSet = new Set(allAttempts.map(a => a.applicationId.toString()));
        const unattemptedAppIds = assignedStudentIds.filter(id => !attemptedAppIdsSet.has(id.toString()));
        
        if (status.toLowerCase() === "missed") {
          matchingAppIds = isExpired ? unattemptedAppIds : [];
        } else if (status.toLowerCase() === "not started") {
          matchingAppIds = !isExpired ? unattemptedAppIds : [];
        }
      }
    }

    // 3. Build match stage for Application collection
    const matchStage = {
      _id: { $in: matchingAppIds },
    };
    if (search) {
      matchStage.$or = [
        { candidateName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { applicationNumber: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } }
      ];
    }

    // 4. Run Count and Paginated Fetch in Parallel (No $facet, No $lookup here)
    const [totalCount, paginatedApps] = await Promise.all([
      Application.countDocuments(matchStage),
      Application.find(matchStage)
        .select("candidateName fatherName mobile email district applicationNumber photo")
        .sort({ candidateName: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    // 5. Fetch attempts ONLY for the paginated records
    const paginatedAppIds = paginatedApps.map(app => app._id);
    const pageAttempts = await Attempt.find({
      testId: new mongoose.Types.ObjectId(req.params.id),
      applicationId: { $in: paginatedAppIds }
    }).lean();

    const attemptMap = pageAttempts.reduce((acc, att) => {
      acc[att.applicationId.toString()] = att;
      return acc;
    }, {});

    // 6. Map to expected frontend structure
    const attempts = paginatedApps.map(app => {
      const attempt = attemptMap[app._id.toString()];
      
      let computedStatus = "Not Started";
      if (attempt) {
        computedStatus = attempt.score >= passingMarks ? "Pass" : "Fail";
      } else if (isExpired) {
        computedStatus = "Missed";
      }

      return {
        _id: attempt ? attempt._id : app._id, // Unique ID (attempt or application)
        testId: req.params.id,
        applicationId: {
          _id: app._id,
          candidateName: app.candidateName,
          fatherName: app.fatherName,
          mobile: app.mobile,
          email: app.email,
          district: app.district,
          applicationNumber: app.applicationNumber,
          photo: app.photo
        },
        score: attempt ? attempt.score : 0,
        status: computedStatus,
        hasAttempt: !!attempt,
        totalQuestions: attempt ? attempt.totalQuestions : 0,
        answeredCount: attempt ? attempt.answeredCount : 0,
        autoSubmitted: attempt ? attempt.autoSubmitted : false,
        startTime: attempt ? attempt.startTime : undefined,
        endTime: attempt ? attempt.endTime : undefined,
        createdAt: attempt ? attempt.createdAt : undefined,
        updatedAt: attempt ? attempt.updatedAt : undefined
      };
    });

    res.json({
      success: true,
      data: {
        attempts,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalCount / limitNum)
        }
      },
    });
  } catch (error) {
    console.error("Get test attempts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch test attempts",
      message: error.message,
    });
  }
});

/**
 * GET /api/create-paper/:id/all-student-ids
 * Get all student IDs assigned to this test, filtered by status/search
 * Useful for "Select All" functionality across pagination
 */
router.get("/:id/all-student-ids", async (req, res) => {
  try {
    const { id } = req.params;
    const { search = "", status = "all" } = req.query;

    const test = await CreatePaper.findById(id).select("assignedStudents passingMarks totalMarks endDate").lean();
    if (!test) return res.status(404).json({ error: "Test not found" });

    // 1. Get all assigned students for this test
    let studentIds = test.assignedStudents || [];

    // 2. If filtering is needed, we need more complex logic
    if (search || status !== "all") {
      // Find all attempts for this test
      const attempts = await Attempt.find({ testId: id }).select("applicationId score").lean();
      const attemptMap = new Map(attempts.map(a => [String(a.applicationId), a]));

      // Fetch student details if searching
      let students = [];
      if (search) {
        const searchRegex = new RegExp(search, "i");
        students = await Application.find({
          _id: { $in: studentIds },
          $or: [
            { candidateName: searchRegex },
            { mobile: searchRegex },
            { email: searchRegex },
            { applicationNumber: searchRegex },
            { district: searchRegex }
          ]
        }).select("_id").lean();
        studentIds = students.map(s => s._id);
      }

      // Filter by status if needed
      if (status !== "all") {
        const passingMarks = test.passingMarks || 40;
        const totalMarks = test.totalMarks || 100;
        const endOfDate = test.endDate ? new Date(test.endDate) : null;
        if (endOfDate) endOfDate.setHours(23, 59, 59, 999);
        const isExpired = endOfDate && endOfDate < new Date();

        studentIds = studentIds.filter(sId => {
          const attempt = attemptMap.get(String(sId));
          let sStatus = "Not Started";

          if (attempt) {
            const pct = Math.round((attempt.score / totalMarks) * 100);
            sStatus = pct >= passingMarks ? "Pass" : "Fail";
          } else if (isExpired) {
            sStatus = "Missed";
          }

          return sStatus.toLowerCase() === status.toLowerCase();
        });
      }
    }

    res.json({
      success: true,
      data: { studentIds }
    });
  } catch (error) {
    console.error("Get all student IDs error:", error);
    res.status(500).json({ error: "Server Error", message: error.message });
  }
});

/**
 * POST /api/create-paper/:id/notify-manual
 * Send manual notifications to selected candidates
 */
router.post("/:id/notify-manual", async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds, channels = { sms: true, email: false } } = req.body;

    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({ error: "No candidates selected" });
    }

    const test = await CreatePaper.findById(id).select("title startDate endDate");
    if (!test) return res.status(404).json({ error: "Test not found" });

    // Format dates
    const startDate = test.startDate ? new Date(test.startDate).toLocaleDateString("en-IN") : "N/A";
    const endDate = test.endDate ? new Date(test.endDate).toLocaleDateString("en-IN") : "N/A";

    const students = await Application.find({ _id: { $in: studentIds } }).select("mobile email candidateName applicationNumber");

    const stats = { sent: 0, failed: 0 };

    for (const student of students) {
      try {
        // SMS & WhatsApp
        if (channels.sms && student.mobile) {
          await sendExamAssignmentSMS(student.mobile, startDate, endDate);
          await sendExamAssignmentWhatsApp(student.mobile, student.applicationNumber || "N/A", startDate, endDate);
        }

        // Email
        if (channels.email && student.email) {
          await sendExamAssignmentEmail({
            to: student.email,
            candidateName: student.candidateName,
            startDate,
            endDate
          });
        }
        stats.sent++;

        // Add a small delay between candidates to prevent SMTP and API throttling
        await sleep(500);
      } catch (err) {
        console.error(`❌ Manual notification failed for ${student.email || student.mobile}:`, err.message);
        stats.failed++;
      }
    }

    res.json({
      success: true,
      message: `Notification process started for ${students.length} candidates.`,
      stats
    });
  } catch (error) {
    console.error("Manual notify error:", error);
    res.status(500).json({ error: "Server error", message: error.message });
  }
});

/**
 * GET /api/create-paper/all/global-unassigned
 * Get all students across the system who are NOT assigned to ANY exam.
 */
router.get("/all/global-unassigned", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", appliedFrom, appliedTo, jobPostingId } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    let limitNum = parseInt(limit, 10);
    if (limit === "0") {
      limitNum = 10000;
    } else {
      limitNum = Math.min(Math.max(limitNum || 10, 1), 1000);
    }
    const skip = (pageNum - 1) * limitNum;

    // Fetch all assigned application IDs across ALL CreatePaper documents
    const allExams = await CreatePaper.find().select("assignedStudents").lean();

    const assignedIdsSet = new Set();
    allExams.forEach((exam) => {
      (exam.assignedStudents || []).forEach((id) => assignedIdsSet.add(id.toString()));
    });

    const assignedIdsArray = Array.from(assignedIdsSet).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Build match for applications NOT in ANY assignedStudents
    const matchStage = {
      _id: { $nin: assignedIdsArray },
      paymentStatus: "paid"
    };

    if (jobPostingId) {
      matchStage.jobPostingId = new mongoose.Types.ObjectId(jobPostingId);
    }

    if (appliedFrom || appliedTo) {
      matchStage.createdAt = {};
      if (appliedFrom) {
        matchStage.createdAt.$gte = new Date(new Date(appliedFrom).setHours(0, 0, 0, 0));
      }
      if (appliedTo) {
        matchStage.createdAt.$lte = new Date(new Date(appliedTo).setHours(23, 59, 59, 999));
      }
    }

    if (search) {
      matchStage.$or = [
        { candidateName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { applicationNumber: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } },
      ];
    }

    const [countResult, students] = await Promise.all([
      Application.countDocuments(matchStage),
      Application.find(matchStage)
        .select("candidateName fatherName mobile email district applicationNumber jobPostingId createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          total: countResult,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(countResult / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get global unassigned error:", error);
    res.status(500).json({ error: "Server Error", message: error.message });
  }
});

/**
 * GET /api/create-paper/all/global-candidates
 * Get all students across the system who have Failed or Missed any exam.
 */
router.get("/all/global-candidates", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", appliedFrom, appliedTo, jobPostingId } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    let limitNum = parseInt(limit, 10);
    if (limit === "0") {
      limitNum = 0; // 0 means no limit in MongoDB
    } else {
      limitNum = Math.min(Math.max(limitNum || 10, 1), 1000);
    }
    const skip = (pageNum - 1) * limitNum;

    // 1. Gather all exams that have assigned students
    const allExams = await CreatePaper.find({ assignedStudents: { $not: { $size: 0 } } })
      .select("assignedStudents passingMarks endDate")
      .lean();

    const failedOrMissedMap = new Map(); // applicationId -> status
    const excludeSet = new Set(); // applicationIds to exclude (active or passed)
    const now = new Date();

    // 2. Fetch all attempts for these exams
    const testIds = allExams.map(exam => exam._id);
    const Attempt = mongoose.model("Attempt"); // Ensure we have the model
    const allAttempts = await Attempt.find({ testId: { $in: testIds } })
      .select("testId applicationId score")
      .lean();

    // Group attempts by testId for quick lookup
    const attemptsByTest = {};
    allAttempts.forEach(att => {
      const tid = att.testId.toString();
      if (!attemptsByTest[tid]) attemptsByTest[tid] = [];
      attemptsByTest[tid].push(att);
    });

    // 3. Process each exam to find Failed, Missed, Passed, and Active
    allExams.forEach(exam => {
      const passingMarks = exam.passingMarks || 40;
      const endOfDate = exam.endDate ? new Date(exam.endDate) : null;
      if (endOfDate) endOfDate.setHours(23, 59, 59, 999);
      const isExpired = endOfDate && endOfDate < now;

      const attempts = attemptsByTest[exam._id.toString()] || [];
      const attemptedAppIdsSet = new Set();

      attempts.forEach(att => {
        const idStr = att.applicationId.toString();
        attemptedAppIdsSet.add(idStr);
        if (att.score < passingMarks) {
          // FAILED Condition
          failedOrMissedMap.set(idStr, "Failed");
        } else {
          // PASSED Condition -> Exclude them from global failed/missed list
          excludeSet.add(idStr);
        }
      });

      (exam.assignedStudents || []).forEach(id => {
        const idStr = id.toString();
        
        if (isExpired) {
          // MISSED Condition
          if (!attemptedAppIdsSet.has(idStr)) {
            if (!failedOrMissedMap.has(idStr)) {
              failedOrMissedMap.set(idStr, "Missed");
            }
          }
        } else {
          // ACTIVE Condition
          if (!attemptedAppIdsSet.has(idStr)) {
            // Assigned to an active exam and hasn't attempted yet -> Exclude them!
            excludeSet.add(idStr);
          }
        }
      });
    });

    // Remove any candidate who is excluded (passed or actively assigned)
    excludeSet.forEach(id => {
      failedOrMissedMap.delete(id);
    });

    const candidateIdsArray = Array.from(failedOrMissedMap.keys()).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // 4. Build match for applications IN the failed/missed list
    const matchStage = {
      _id: { $in: candidateIdsArray },
      paymentStatus: "paid"
    };

    if (jobPostingId) {
      matchStage.jobPostingId = new mongoose.Types.ObjectId(jobPostingId);
    }

    if (appliedFrom || appliedTo) {
      matchStage.createdAt = {};
      if (appliedFrom) {
        matchStage.createdAt.$gte = new Date(new Date(appliedFrom).setHours(0, 0, 0, 0));
      }
      if (appliedTo) {
        matchStage.createdAt.$lte = new Date(new Date(appliedTo).setHours(23, 59, 59, 999));
      }
    }

    if (search) {
      matchStage.$or = [
        { candidateName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { applicationNumber: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } },
      ];
    }

    const [countResult, students] = await Promise.all([
      Application.countDocuments(matchStage),
      Application.find(matchStage)
        .select("candidateName fatherName mobile email district applicationNumber jobPostingId createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const studentsWithStatus = students.map(student => {
       return {
         ...student,
         status: failedOrMissedMap.get(student._id.toString()) || "Failed"
       };
    });

    res.json({
      success: true,
      data: {
        students: studentsWithStatus,
        pagination: {
          total: countResult,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(countResult / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get global candidates error:", error);
    res.status(500).json({ error: "Server Error", message: error.message });
  }
});

/**
 * GET /api/create-paper/all/referred-unassigned
 * Get all students across the system who are NOT assigned to ANY exam, and have been referred by an employee.
 */
router.get("/all/referred-unassigned", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", appliedFrom, appliedTo, jobPostingId } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    let limitNum = parseInt(limit, 10);
    if (limit === "0") {
      limitNum = 10000;
    } else {
      limitNum = Math.min(Math.max(limitNum || 10, 1), 1000);
    }
    const skip = (pageNum - 1) * limitNum;

    // Fetch all assigned application IDs across ALL CreatePaper documents
    const allExams = await CreatePaper.find().select("assignedStudents").lean();

    const assignedIdsSet = new Set();
    allExams.forEach((exam) => {
      (exam.assignedStudents || []).forEach((id) => assignedIdsSet.add(id.toString()));
    });

    const assignedIdsArray = Array.from(assignedIdsSet).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Build match for applications NOT in ANY assignedStudents AND referredBy is NOT null
    const matchStage = {
      _id: { $nin: assignedIdsArray },
      paymentStatus: "paid",
      referredBy: { $ne: null }
    };

    if (jobPostingId) {
      matchStage.jobPostingId = new mongoose.Types.ObjectId(jobPostingId);
    }

    if (appliedFrom || appliedTo) {
      matchStage.createdAt = {};
      if (appliedFrom) {
        matchStage.createdAt.$gte = new Date(new Date(appliedFrom).setHours(0, 0, 0, 0));
      }
      if (appliedTo) {
        matchStage.createdAt.$lte = new Date(new Date(appliedTo).setHours(23, 59, 59, 999));
      }
    }

    if (search) {
      matchStage.$or = [
        { candidateName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { applicationNumber: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } },
      ];
    }

    const [countResult, students] = await Promise.all([
      Application.countDocuments(matchStage),
      Application.find(matchStage)
        .select("candidateName fatherName mobile email district applicationNumber jobPostingId referredBy createdAt")
        .populate({
          path: "referredBy",
          select: "name employeeId"
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          total: countResult,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(countResult / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get referred unassigned error:", error);
    res.status(500).json({ error: "Server Error", message: error.message });
  }
});


/**
 * DELETE /api/create-paper/:id/attempts/:applicationId
 * Delete attempts for a specific student to allow re-exam
 */
router.delete("/:id/attempts/:applicationId", async (req, res) => {
  try {
    const { id, applicationId } = req.params;

    // Find attempts count for this user
    const deleted = await Attempt.deleteMany({
      testId: id,
      applicationId: applicationId
    });

    if (deleted.deletedCount > 0) {
      // Decrement the total attempts count in CreatePaper
      await CreatePaper.findByIdAndUpdate(id, {
        $inc: { attempts: -deleted.deletedCount }
      });
    }

    res.json({
      success: true,
      message: `Successfully reset attempts for student. They can now re-take the exam.`,
      deletedCount: deleted.deletedCount
    });
  } catch (error) {
    console.error("Delete test attempt error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset test attempts",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/create-paper/:id/attempts/bulk-reset
 * Reset attempts for all provided student IDs
 */
router.delete("/:id/attempts/bulk-reset", async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: "No student IDs provided." });
    }

    const deleted = await Attempt.deleteMany({
      testId: id,
      applicationId: { $in: studentIds }
    });

    if (deleted.deletedCount > 0) {
      await CreatePaper.findByIdAndUpdate(id, {
        $inc: { attempts: -deleted.deletedCount }
      });
    }

    res.json({
      success: true,
      message: `Successfully reset attempts for ${deleted.deletedCount} students.`,
      deletedCount: deleted.deletedCount
    });
  } catch (error) {
    console.error("Bulk reset attempts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to bulk reset attempts",
      message: error.message,
    });
  }
});

/**
 * GET /api/create-paper/:id
 * Get single test/paper (standard population)
 */
router.get("/:id", async (req, res) => {
  try {
    const test = await CreatePaper.findById(req.params.id)
      .populate("createdBy", "email role")
      .populate("assignedStudents", "candidateName mobile email district fatherName")
      .populate("questionConfigs.questionId", "question options marks difficulty topic");
    if (!test) return res.status(404).json({ error: "Test not found" });

    res.json({
      success: true,
      data: { test },
    });
  } catch (error) {
    console.error("Get create paper by id error:", error);
    res.status(500).json({
      error: "Failed to fetch test",
      message: error.message,
    });
  }
});

/**
 * GET /api/create-paper/dev/migrate-reschedules
 * One-time script to group existing rescheduled exams correctly
 */
router.get("/dev/migrate-reschedules", async (req, res) => {
  try {
    const allExams = await CreatePaper.find();
    let migratedCount = 0;
    let unlinkedCount = 0;

    for (const exam of allExams) {
      const titleTrimmed = exam.title.trim();
      const hasPrefix = /^(Rescheduled|Re-Exam):/i.test(titleTrimmed);

      if (hasPrefix) {
        const originalTitle = titleTrimmed.replace(/^(Rescheduled|Re-Exam):\s*/i, "").trim();
        const parent = await CreatePaper.findOne({
          title: originalTitle,
          createdAt: { $lt: exam.createdAt },
          parentExamId: null
        }).sort({ createdAt: 1 });

        if (parent) {
          exam.parentExamId = parent._id;
          if (!exam.rescheduleTarget) {
            const Attempt = mongoose.model("Attempt");
            const sampleStudent = exam.assignedStudents?.[0];
            if (sampleStudent) {
              const attempt = await Attempt.findOne({ testId: parent._id, applicationId: sampleStudent });
              exam.rescheduleTarget = attempt ? "Fail" : "Missed";
            }
          }
          await exam.save();
          migratedCount++;
        }
      } else if (exam.parentExamId) {
        // If no prefix, it MUST NOT be a child (for old data)
        exam.parentExamId = null;
        exam.rescheduleTarget = null;
        await exam.save();
        unlinkedCount++;
      }
    }

    res.json({
      success: true,
      message: `Refined Migration: Linked ${migratedCount} reschedules, Unlinked ${unlinkedCount} non-reschedules.`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Mutations need authentication
//router.use(authenticate);

/**
 * POST /api/create-paper/:id/re-exam
 * Create a new exam by cloning the questions of :id but only for failed/missed students
 */
router.post("/:id/re-exam", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      studentIds,
      titlePrefix = "Re-Exam: ",
      startDate,
      endDate,
      mouStartDate,
      mouEndDate,
      resultDate,
      showResult,
      rescheduleTarget,
      status = "draft"
    } = req.body;

    const original = await CreatePaper.findById(id);
    if (!original) return res.status(404).json({ error: "Original test not found" });

    // Clone data
    const cloneData = original.toObject();
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    delete cloneData.attempts;
    delete cloneData.avgScore;

    cloneData.title = `${titlePrefix}${original.title}`;
    cloneData.assignedStudents = studentIds || [];
    cloneData.status = status;
    cloneData.startDate = startDate || cloneData.startDate;
    cloneData.endDate = endDate || cloneData.endDate;
    cloneData.mouStartDate = mouStartDate || cloneData.mouStartDate;
    cloneData.mouEndDate = mouEndDate || cloneData.mouEndDate;
    if (showResult !== undefined) cloneData.showResult = showResult;
    cloneData.resultDate = (showResult || (!showResult && showResult !== false && cloneData.showResult)) ? "" : (resultDate || cloneData.resultDate);
    cloneData.parentExamId = original._id;
    cloneData.rescheduleTarget = rescheduleTarget || null;
    cloneData.createdDate = new Date();
    cloneData.createdBy = req.user.id;

    const newTest = await CreatePaper.create(cloneData);

    // Trigger Notifications if status is published
    if (newTest.status === "published" && newTest.assignedStudents?.length > 0) {
      console.log(`🎯 Triggering notifications for Rescheduled Exam: ${newTest.title}`);
      sendAssignmentNotifications(newTest.assignedStudents, newTest.startDate, newTest.endDate);
    }

    res.json({
      success: true,
      message: "Rescheduled exam created successfully and candidates notified.",
      data: { test: newTest }
    });
  } catch (error) {
    console.error("Create re-exam error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create re-exam paper",
      message: error.message,
    });
  }
});

const createValidation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("duration").isInt({ min: 1 }).withMessage("Duration must be at least 1"),
  body("status")
    .optional()
    .isIn(["published", "draft"])
    .withMessage("Status must be published or draft"),
  body("questionConfigs").optional().isArray(),
  body("rewards").optional().isArray(),
];

/**
 * POST /api/create-paper
 * Create test/paper (admin only)
 */
router.post("/", createValidation, async (req, res) => {
  console.log("🚀 POST /api/create-paper called");
  console.log("📦 Request Body:", JSON.stringify(req.body, null, 2));
  try {
    if (req.user.role !== "admin" && req.user.role !== "staff") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins and staff can create tests",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        errors: errors.array(),
      });
    }

    const payload = normalizePayload(req.body);
    const test = await CreatePaper.create({
      ...payload,
      createdBy: req.user.id,
      status: payload.status === "published" ? "published" : "draft",
      createdDate: payload.createdDate ? new Date(payload.createdDate) : new Date(),
    });

    await test.populate("createdBy", "email role");

    // If published, send SMS to all assigned students
    console.log(`🔍 Checking for SMS trigger (Create). Status: ${test.status}, Assigned: ${test.assignedStudents?.length || 0}`);
    if (test.status === "published" && test.assignedStudents && test.assignedStudents.length > 0) {
      console.log("🎯 Triggering sendAssignmentNotifications (Create)");
      sendAssignmentNotifications(test.assignedStudents, test.startDate, test.endDate);
    }

    res.status(201).json({
      success: true,
      message: "Test created successfully",
      data: { test },
    });
  } catch (error) {
    console.error("Create paper error:", error);
    res.status(500).json({
      error: "Failed to create test",
      message: error.message,
    });
  }
});

/**
 * PUT /api/create-paper/:id
 * Update test/paper (admin only)
 */
router.put("/:id", async (req, res) => {
  console.log(`🚀 PUT /api/create-paper/${req.params.id} called`);
  console.log("📦 Request Body:", JSON.stringify(req.body, null, 2));
  try {
    if (req.user.role !== "admin" && req.user.role !== "staff") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins and staff can update tests",
      });
    }

    const test = await CreatePaper.findById(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });

    // Use req.body directly for partial updates to avoid overwriting with defaults
    const updateData = { ...req.body };

    // Check if status is being updated to published
    const statusChangedToPublished = test.status !== "published" && updateData.status === "published";

    // Check if new students are being added (only if assignedStudents is in request)
    let newStudents = [];
    if (Array.isArray(updateData.assignedStudents)) {
      const oldStudents = test.assignedStudents.map(id => id.toString());
      newStudents = updateData.assignedStudents.filter(id => !oldStudents.includes(id.toString()));
    }

    // Apply only provided fields
    Object.assign(test, updateData);

    // Handle specific type conversions if they are provided
    if (updateData.duration !== undefined) test.duration = toNumberOrDefault(updateData.duration, test.duration);
    if (updateData.passingMarks !== undefined) test.passingMarks = toNumberOrDefault(updateData.passingMarks, test.passingMarks);
    if (updateData.maxAttempts !== undefined) test.maxAttempts = toNumberOrDefault(updateData.maxAttempts, test.maxAttempts);
    if (updateData.isPublic !== undefined) test.isPublic = toBooleanOrDefault(updateData.isPublic, test.isPublic);
    if (updateData.shuffleQuestions !== undefined) test.shuffleQuestions = toBooleanOrDefault(updateData.shuffleQuestions, test.shuffleQuestions);
    if (updateData.showResult !== undefined) test.showResult = toBooleanOrDefault(updateData.showResult, test.showResult);
    if (updateData.mouStartDate !== undefined) test.mouStartDate = updateData.mouStartDate;
    if (updateData.mouEndDate !== undefined) test.mouEndDate = updateData.mouEndDate;

    await test.save();
    await test.populate("createdBy", "email role");

    console.log(`🔍 Checking for SMS trigger (Update). Published: ${test.status === "published"}, StatusChanged: ${statusChangedToPublished}, NewStudents: ${newStudents.length}, TotalAssigned: ${test.assignedStudents?.length || 0}`);

    // If status changed to published, send to ALL assigned students
    if (statusChangedToPublished && test.assignedStudents && test.assignedStudents.length > 0) {
      console.log(`🎯 Triggering sendAssignmentNotifications (Status change to Published for ${test.assignedStudents.length} students)`);
      sendAssignmentNotifications(test.assignedStudents, test.startDate, test.endDate);
    }
    // Otherwise, if already published and new students were added in this update
    else if (test.status === "published" && newStudents.length > 0) {
      console.log(`🎯 Triggering sendAssignmentNotifications for ${newStudents.length} new students`);
      sendAssignmentNotifications(newStudents, test.startDate, test.endDate);
    }

    res.json({
      success: true,
      message: "Test updated successfully",
      data: { test },
    });
  } catch (error) {
    console.error("Update paper error:", error);
    res.status(500).json({
      error: "Failed to update test",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/create-paper/:id
 * Delete test/paper (admin only)
 */
router.delete("/:id", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admins can delete tests",
      });
    }

    const test = await CreatePaper.findById(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });

    await CreatePaper.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.error("Delete paper error:", error);
    res.status(500).json({
      error: "Failed to delete test",
      message: error.message,
    });
  }
});

/**
 * POST /api/create-paper/:id/submit
 * Submit an exam attempt (applicant only)
 */
router.post("/:id/submit", authenticate, async (req, res) => {
  try {
    const test = await CreatePaper.findById(req.params.id).populate("questionConfigs.questionId");
    if (!test) return res.status(404).json({ error: "Test not found" });

    // Check attempts limit
    const attemptsCount = await Attempt.countDocuments({
      testId: test._id,
      userId: req.user.id,
    });

    if (attemptsCount >= (test.maxAttempts || 1)) {
      return res.status(400).json({
        error: "Max attempts reached",
        message: "You have already reached the maximum attempts for this test.",
      });
    }

    const { answers, answeredCount, autoSubmitted } = req.body;

    // Get the correct application that was specifically assigned to this test
    const application = await Application.findOne({
      createdBy: req.user.id,
      _id: { $in: test.assignedStudents }
    }) || await Application.findOne({ createdBy: req.user.id }).sort({ createdAt: -1 });

    // Calculate score
    let score = 0;
    const testQuestions = test.questionConfigs || [];

    testQuestions.forEach(config => {
      const qId = config.questionId?._id?.toString();
      const studentAnswerIndex = answers[qId];

      if (studentAnswerIndex !== undefined) {
        const correctOption = config.questionId?.correctAnswer; // Usually "A", "B", "C", "D" or the text
        const options = config.questionId?.options || [];

        // Match by index (0=A, 1=B, etc.) or by text
        const selectedOptionText = options[studentAnswerIndex];

        if (selectedOptionText === correctOption ||
          String.fromCharCode(65 + studentAnswerIndex) === correctOption) {
          score += config.marks || 1;
        }
      }
    });

    const attempt = await Attempt.create({
      testId: test._id,
      userId: req.user.id,
      applicationId: application ? application._id : null,
      answers,
      answeredCount,
      autoSubmitted,
      score,
      totalQuestions: test.totalQuestions || 0,
      endTime: new Date(),
    });

    // Increment attempts count in CreatePaper
    await CreatePaper.findByIdAndUpdate(test._id, { $inc: { attempts: 1 } });

    // Send instant Result SMS if results are public and student PASSED
    const isPassed = score >= (test.passingMarks || 0);
    if (test.showResult && isPassed && application && application.mobile) {
      console.log(`📱 Instant Result: Student ${application.candidateName} passed. Triggering SMS...`);
      sendExamPassSMS(
        application.mobile,
        application.applicationNumber,
        score,
        test.mouStartDate || "N/A",
        test.mouEndDate || "N/A"
      ).catch(err => console.error("❌ Instant pass SMS failed:", err));

      // NEW: Trigger WhatsApp Notification
      console.log(`📱 Instant WhatsApp: Student ${application.candidateName} passed. Triggering WhatsApp...`);
      sendMOUProcessWhatsApp(
        application.mobile,
        application.candidateName || "Candidate",
        application.applicationNumber || "N/A",
        test.mouStartDate || "N/A",
        test.mouEndDate || "N/A"
      ).catch(err => console.error("❌ Instant pass WhatsApp failed:", err));
    }

    // Determine if result should be shown instantly
    const showInstant = test.showResult;
    const resultDate = test.resultDate;
    const now = new Date();

    let resultMessage = "";
    if (showInstant) {
      resultMessage = `You scored ${score} marks.`;
    } else if (resultDate) {
      resultMessage = `Your result will be declared on ${resultDate}.`;
    } else {
      resultMessage = "Your attempt has been saved. Results will be announced later.";
    }

    res.json({
      success: true,
      message: "Attempt submitted successfully",
      data: {
        attemptId: attempt._id,
        score: showInstant ? score : null,
        showInstant,
        resultMessage
      },
    });
  } catch (error) {
    console.error("Submit attempt error:", error);
    res.status(500).json({
      error: "Failed to submit attempt",
      message: error.message,
    });
  }
});

/**
 * GET /api/create-paper/:id/review
 * Get attempt details for review (without correct answers)
 */
router.get("/:id/review", authenticate, async (req, res) => {
  try {
    const test = await CreatePaper.findById(req.params.id).populate("questionConfigs.questionId");
    if (!test) return res.status(404).json({ error: "Test not found" });

    const attempt = await Attempt.findOne({
      testId: test._id,
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    if (!attempt) {
      return res.status(404).json({ error: "No attempt found for this test" });
    }

    // Map questions with user answers and correctness, but NO correct answers
    const reviewData = (test.questionConfigs || []).map(config => {
      const qId = config.questionId?._id?.toString();
      const userAnswerIndex = attempt.answers.get(qId);
      const options = config.questionId?.options || [];
      const correctAnswer = config.questionId?.correctAnswer;

      let isCorrect = false;
      if (userAnswerIndex !== undefined) {
        const selectedOptionText = options[userAnswerIndex];
        if (selectedOptionText === correctAnswer ||
          String.fromCharCode(65 + userAnswerIndex) === correctAnswer) {
          isCorrect = true;
        }
      }

      return {
        id: qId,
        question: config.questionId?.question,
        questionHi: config.questionId?.questionHi,
        options: options,
        optionsHi: config.questionId?.optionsHi || [],
        userAnswerIndex,
        isCorrect,
        // We explicitly do NOT send the correct answer index or text
      };
    });

    res.json({
      success: true,
      data: {
        testTitle: test.title,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        review: reviewData
      }
    });
  } catch (error) {
    console.error("Get review error:", error);
    res.status(500).json({
      error: "Failed to fetch review data",
      message: error.message,
    });
  }
});


/**
 * Get list of all passed candidates for MOU management (Optimized with Aggregation)
 */
router.get("/mou/global-list", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all", mouFrom, mouTo, notificationStatus = "all", state, district, designation } = req.query;
    const skip = (page - 1) * Number(limit);
    const now = new Date();

    // 1. Initial Match for search query (Application search)
    let initialMatch = {};
    if (search) {
      const matchedApps = await Application.find({
        $or: [
          { candidateName: { $regex: search, $options: "i" } },
          { applicationNumber: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } }
        ]
      }).select("_id");
      initialMatch.applicationId = { $in: matchedApps.map(a => a._id) };
    }

    const pipeline = [
      { $match: initialMatch },
      { $sort: { createdAt: -1 } },
      // Join Test details
      {
        $lookup: {
          from: "createpapers",
          localField: "testId",
          foreignField: "_id",
          as: "testInfo"
        }
      },
      {
        $lookup: {
          from: "appforms",
          localField: "applicationId",
          foreignField: "_id",
          as: "appInfo"
        }
      },
      { $unwind: "$testInfo" },
      { $unwind: { path: "$appInfo", preserveNullAndEmptyArrays: true } },
      // Filter by Passing Score
      {
        $match: {
          $expr: { $gte: ["$score", { $ifNull: ["$testInfo.passingMarks", 0] }] }
        }
      },
      // Join Application details
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "_id",
          as: "appInfo"
        }
      },
      { $unwind: "$appInfo" },
      // Join JobPosting details
      {
        $lookup: {
          from: "jobpostings",
          localField: "appInfo.jobPostingId",
          foreignField: "_id",
          as: "jobInfo"
        }
      },
      { $unwind: { path: "$jobInfo", preserveNullAndEmptyArrays: true } },
      // Dynamic Field: currentStatus (calculates 'Missed' on the fly)
      {
        $addFields: {
          currentStatus: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $ifNull: ["$mouStatus", "Pending"] }, "Pending"] },
                  { $ne: ["$testInfo.mouEndDate", null] },
                  { $ne: ["$testInfo.mouEndDate", ""] },
                  { $eq: [{ $type: "$testInfo.mouEndDate" }, "string"] },
                  { $lt: [{ $dateFromString: { dateString: "$testInfo.mouEndDate", onError: new Date(0) } }, now] }
                ]
              },
              then: "Missed",
              else: { $ifNull: ["$mouStatus", "Pending"] }
            }
          }
        }
      }
    ];

    // Filter by Status Tab
    if (status !== "all" && status !== "pass") {
      pipeline.push({
        $match: { currentStatus: { $regex: new RegExp(`^${status}$`, "i") } }
      });
    }

    // Filter by Notification Status (Pending / Sent / Failed)
    if (notificationStatus && notificationStatus !== "all") {
      pipeline.push({
        $match: {
          notificationStatus: notificationStatus === "Pending"
            ? { $in: ["Pending", null] }
            : notificationStatus
        }
      });
    }

    // Filter by MOU Start Date Range (mouFrom / mouTo)
    if (mouFrom || mouTo) {
      const dateMatch = {};
      if (mouFrom) {
        dateMatch["testInfo.mouStartDate"] = { $gte: mouFrom };
      }
      if (mouTo) {
        if (!dateMatch["testInfo.mouStartDate"]) dateMatch["testInfo.mouStartDate"] = {};
        dateMatch["testInfo.mouStartDate"].$lte = mouTo;
      }
      pipeline.push({ $match: dateMatch });
    }

    // Filter by State, District, and Designation
    const filterMatch = {};
    if (state) filterMatch["appInfo.state"] = state;
    if (district) filterMatch["appInfo.district"] = district;
    if (designation) {
      if (designation === "Block Supervisor cum Panchayat Executive") {
        filterMatch["jobInfo.post.en"] = { $regex: /block supervisor/i };
      } else if (designation === "Panchayat Executive") {
        filterMatch["$and"] = [
          { "jobInfo.post.en": { $regex: /panchayat executive/i } },
          { "jobInfo.post.en": { $not: /block supervisor/i } }
        ];
      } else {
        filterMatch["jobInfo.post.en"] = { $regex: new RegExp(designation, "i") };
      }
    }
    if (Object.keys(filterMatch).length > 0) {
      pipeline.push({ $match: filterMatch });
    }

    // Clone pipeline for count before pagination
    const countPipeline = [...pipeline, { $count: "total" }];

    // Pagination logic
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: Number(limit) });

    const [results, countResult] = await Promise.all([
      Attempt.aggregate(pipeline).allowDiskUse(true),
      Attempt.aggregate(countPipeline).allowDiskUse(true)
    ]);

    const total = countResult[0]?.total || 0;

    // Format output to match existing UI expectation
    const formattedAttempts = results.map(doc => ({
      ...doc,
      mouStatus: doc.currentStatus, // Use the calculated status
      notificationStatus: doc.notificationStatus || "Pending",
      lastNotifiedAt: doc.lastNotifiedAt,
      applicationId: {
        _id: doc.appInfo?._id || doc.applicationId,
        candidateName: doc.appInfo?.candidateName || "-",
        applicationNumber: doc.appInfo?.applicationNumber || "-",
        mobile: doc.appInfo?.mobile || "-",
        district: doc.appInfo?.district || "-",
        createdAt: doc.appInfo?.createdAt
      },
      testId: {
        _id: doc.testInfo?._id,
        title: doc.testInfo?.title,
        mouStartDate: doc.testInfo?.mouStartDate || "-",
        mouEndDate: doc.testInfo?.mouEndDate || "-"
      }
    }));

    res.json({
      success: true,
      data: {
        attempts: formattedAttempts,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error("Optimized Fetch MOU list error:", error);
    res.status(500).json({ error: "Failed to fetch MOU list (Optimized)" });
  }
});

/**
 * GET /api/create-paper/mou/export-csv
 * Export MOU list to CSV (Professional Backend Approach)
 */
router.get("/mou/export-csv", authenticate, async (req, res) => {
  try {
    const { status = "all", search = "", mouFrom, mouTo, state, district, designation } = req.query;
    const now = new Date();

    const pipeline = [
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "createpapers",
          localField: "testId",
          foreignField: "_id",
          as: "testInfo"
        }
      },
      { $unwind: "$testInfo" },
      {
        $match: {
          $expr: { $gte: ["$score", { $ifNull: ["$testInfo.passingMarks", 0] }] }
        }
      },
      // Join Application details
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "_id",
          as: "appInfo"
        }
      },
      { $unwind: "$appInfo" },
      // Join JobPosting details
      {
        $lookup: {
          from: "jobpostings",
          localField: "appInfo.jobPostingId",
          foreignField: "_id",
          as: "jobInfo"
        }
      },
      { $unwind: { path: "$jobInfo", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          currentStatus: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $ifNull: ["$mouStatus", "Pending"] }, "Pending"] },
                  { $ne: ["$testInfo.mouEndDate", null] },
                  { $ne: ["$testInfo.mouEndDate", ""] },
                  { $eq: [{ $type: "$testInfo.mouEndDate" }, "string"] },
                  { $lt: [{ $dateFromString: { dateString: "$testInfo.mouEndDate", onError: new Date(0) } }, now] }
                ]
              },
              then: "Missed",
              else: { $ifNull: ["$mouStatus", "Pending"] }
            }
          }
        }
      }
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "appInfo.candidateName": { $regex: search, $options: "i" } },
            { "appInfo.applicationNumber": { $regex: search, $options: "i" } },
            { "appInfo.mobile": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    if (status !== "all" && status !== "pass") {
      pipeline.push({ $match: { currentStatus: { $regex: new RegExp(`^${status}$`, "i") } } });
    }

    if (mouFrom || mouTo) {
      const dateMatch = {};
      if (mouFrom) dateMatch["testInfo.mouStartDate"] = { $gte: mouFrom };
      if (mouTo) {
        if (!dateMatch["testInfo.mouStartDate"]) dateMatch["testInfo.mouStartDate"] = {};
        dateMatch["testInfo.mouStartDate"].$lte = mouTo;
      }
      pipeline.push({ $match: dateMatch });
    }

    // Filter by State, District, and Designation
    const filterMatch = {};
    if (state) filterMatch["appInfo.state"] = state;
    if (district) filterMatch["appInfo.district"] = district;
    if (designation) {
      if (designation === "Block Supervisor cum Panchayat Executive") {
        filterMatch["jobInfo.post.en"] = { $regex: /block supervisor/i };
      } else if (designation === "Panchayat Executive") {
        filterMatch["$and"] = [
          { "jobInfo.post.en": { $regex: /panchayat executive/i } },
          { "jobInfo.post.en": { $not: /block supervisor/i } }
        ];
      } else {
        filterMatch["jobInfo.post.en"] = { $regex: new RegExp(designation, "i") };
      }
    }
    if (Object.keys(filterMatch).length > 0) {
      pipeline.push({ $match: filterMatch });
    }

    // Execute with allowDiskUse
    const results = await Attempt.aggregate(pipeline).allowDiskUse(true);

    const cleanText = (str) => {
      if (!str) return "-";
      let cleaned = str.split("/")[0].trim();
      cleaned = cleaned.replace(/[^\x00-\x7F]/g, "").trim();
      return cleaned || "-";
    };

    // Build Excel rows
    const headers = [
      "S.No",
      "Candidate Name",
      "Application Number",
      "Email",
      "Mobile",
      "Designation",
      "State",
      "District",
      "Block",
      "Panchayat",
      "MOU Status",
      "MOU Start",
      "MOU End"
    ];

    const rows = results.map((doc, index) => ({
      "S.No": index + 1,
      "Candidate Name": cleanText(doc.appInfo?.candidateName),
      "Application Number": String(doc.appInfo?.applicationNumber || "-"),
      "Email": doc.appInfo?.email || "-",
      "Mobile": String(doc.appInfo?.mobile || "-"),
      "Designation": cleanText(doc.jobInfo?.post?.en),
      "State": cleanText(doc.appInfo?.state),
      "District": cleanText(doc.appInfo?.district),
      "Block": cleanText(doc.appInfo?.block),
      "Panchayat": cleanText(doc.appInfo?.panchayat),
      "MOU Status": doc.currentStatus || "Pending",
      "MOU Start": doc.testInfo?.mouStartDate || "-",
      "MOU End": doc.testInfo?.mouEndDate || "-"
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

    // Set column widths (in chars)
    ws["!cols"] = [
      { wch: 6 },   // S.No
      { wch: 25 },  // Candidate Name
      { wch: 22 },  // Application Number
      { wch: 30 },  // Email
      { wch: 16 },  // Mobile
      { wch: 28 },  // Designation
      { wch: 20 },  // State
      { wch: 20 },  // District
      { wch: 22 },  // Block
      { wch: 22 },  // Panchayat
      { wch: 14 },  // MOU Status
      { wch: 14 },  // MOU Start
      { wch: 14 }   // MOU End
    ];

    XLSX.utils.book_append_sheet(wb, ws, "MOU List");

    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = `MOU_List_${status}_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(excelBuffer);
  } catch (error) {
    console.error("Export Excel Error:", error);
    res.status(500).json({ error: "Failed to export Excel" });
  }
});

/**
 * GET /api/create-paper/mou/global-ids
 * Get all matching record IDs (Optimized with Aggregation)
 */
router.get("/mou/global-ids", authenticate, async (req, res) => {
  try {
    const { search = "", status = "all", mouFrom, mouTo, state, district, designation } = req.query;
    const now = new Date();

    let initialMatch = {};
    if (search) {
      const matchedApps = await Application.find({
        $or: [
          { candidateName: { $regex: search, $options: "i" } },
          { applicationNumber: { $regex: search, $options: "i" } }
        ]
      }).select("_id");
      initialMatch.applicationId = { $in: matchedApps.map(a => a._id) };
    }

    const pipeline = [
      { $match: initialMatch },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "createpapers",
          localField: "testId",
          foreignField: "_id",
          as: "testInfo"
        }
      },
      {
        $lookup: {
          from: "appforms",
          localField: "applicationId",
          foreignField: "_id",
          as: "appInfo"
        }
      },
      { $unwind: "$testInfo" },
      { $unwind: { path: "$appInfo", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $expr: { $gte: ["$score", { $ifNull: ["$testInfo.passingMarks", 0] }] }
        }
      },
      // Join Application details
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "_id",
          as: "appInfo"
        }
      },
      { $unwind: "$appInfo" },
      // Join JobPosting details
      {
        $lookup: {
          from: "jobpostings",
          localField: "appInfo.jobPostingId",
          foreignField: "_id",
          as: "jobInfo"
        }
      },
      { $unwind: { path: "$jobInfo", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          currentStatus: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $ifNull: ["$mouStatus", "Pending"] }, "Pending"] },
                  { $ne: ["$testInfo.mouEndDate", null] },
                  { $ne: ["$testInfo.mouEndDate", ""] },
                  { $eq: [{ $type: "$testInfo.mouEndDate" }, "string"] },
                  { $lt: [{ $dateFromString: { dateString: "$testInfo.mouEndDate", onError: new Date(0) } }, now] }
                ]
              },
              then: "Missed",
              else: { $ifNull: ["$mouStatus", "Pending"] }
            }
          }
        }
      }
    ];

    if (status !== "all" && status !== "pass") {
      pipeline.push({ $match: { currentStatus: { $regex: new RegExp(`^${status}$`, "i") } } });
    }

    if (mouFrom || mouTo) {
      const dateMatch = {};
      if (mouFrom) dateMatch["testInfo.mouStartDate"] = { $gte: mouFrom };
      if (mouTo) {
        if (!dateMatch["testInfo.mouStartDate"]) dateMatch["testInfo.mouStartDate"] = {};
        dateMatch["testInfo.mouStartDate"].$lte = mouTo;
      }
      pipeline.push({ $match: dateMatch });
    }

    // Filter by State, District, and Designation
    const filterMatch = {};
    if (state) filterMatch["appInfo.state"] = state;
    if (district) filterMatch["appInfo.district"] = district;
    if (designation) {
      if (designation === "Block Supervisor cum Panchayat Executive") {
        filterMatch["jobInfo.post.en"] = { $regex: /block supervisor/i };
      } else if (designation === "Panchayat Executive") {
        filterMatch["jobInfo.post.en"] = { $regex: /panchayat executive/i };
      } else {
        filterMatch["jobInfo.post.en"] = { $regex: new RegExp(designation, "i") };
      }
    }
    if (Object.keys(filterMatch).length > 0) {
      pipeline.push({ $match: filterMatch });
    }

    pipeline.push({
      $project: {
        attemptId: "$_id",
        testId: "$testId"
      }
    });

    const results = await Attempt.aggregate(pipeline).allowDiskUse(true);

    res.json({
      success: true,
      data: { results }
    });
  } catch (error) {
    console.error("Optimized Fetch MOU IDs error:", error);
    res.status(500).json({ error: "Failed to fetch MOU IDs (Optimized)" });
  }
});

/**
 * PATCH /api/create-paper/mou/update-status/:id
 * Update MOU status for a specific attempt
 */
router.patch("/mou/update-status/:id", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Done", "Missed", "ConvertedEmployee"].includes(status)) {
      return res.status(400).json({ error: "Invalid MOU status" });
    }

    const attempt = await Attempt.findByIdAndUpdate(
      req.params.id,
      { mouStatus: status },
      { new: true }
    );

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    res.json({ success: true, data: attempt });
  } catch (error) {
    console.error("Update MOU status error:", error);
    res.status(500).json({ error: "Failed to update MOU status" });
  }
});

/**
 * POST /api/create-paper/mou/bulk-convert
 * Mark Done MOU attempts as ConvertedEmployee (status tracking only)
 */
router.post("/mou/bulk-convert", authenticate, async (req, res) => {
  try {
    const { attemptIds } = req.body;

    if (!attemptIds || !Array.isArray(attemptIds) || attemptIds.length === 0) {
      return res.status(400).json({ error: "No candidates selected" });
    }

    const validIds = attemptIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ error: "Invalid attempt IDs" });
    }

    const attemptsToConvert = await Attempt.find({ _id: { $in: validIds }, mouStatus: "Done" }).populate("applicationId");

    let modifiedCount = 0;
    
    // Process each conversion individually to handle referrals
    for (const attempt of attemptsToConvert) {
      attempt.mouStatus = "ConvertedEmployee";
      await attempt.save();
      modifiedCount++;
      
      const app = attempt.applicationId;
      // Note: Referral bonus is now credited instantly during MOU payment in mou.js
    }
    const skipped = validIds.length - modifiedCount;

    res.json({
      success: true,
      message: `${modifiedCount} candidate(s) converted`,
      data: { modifiedCount, skipped, totalRequested: validIds.length },
    });
  } catch (error) {
    console.error("Bulk convert MOU error:", error);
    res.status(500).json({ error: "Failed to convert candidates" });
  }
});



/**
 * POST /api/create-paper/mou/notify
 * Send notifications (SMS/WhatsApp) to MOU candidates in bulk
 */
router.post("/mou/notify", authenticate, async (req, res) => {
  try {
    const { attemptIds, channels } = req.body;

    if (!attemptIds || !Array.isArray(attemptIds) || attemptIds.length === 0) {
      return res.status(400).json({ error: "No candidates selected" });
    }

    if (!channels || (!channels.sms && !channels.email)) {
      return res.status(400).json({ error: "No notification channel selected" });
    }

    // Fetch details for all selected attempts
    const attempts = await Attempt.find({ _id: { $in: attemptIds } })
      .populate("applicationId")
      .populate("testId")
      .lean();

    const stats = { sent: 0, failed: 0 };
    // Sequential processing with small delay to avoid API rate limiting
    for (const attempt of attempts) {
      const application = attempt.applicationId;
      const test = attempt.testId;

      if (!application || !application.mobile) {
        stats.failed++;
        continue;
      }

      try {
        const notifications = [];

        // 1. Send SMS
        if (channels.sms) {
          notifications.push(
            sendExamPassSMS(
              application.mobile,
              application.applicationNumber || "N/A",
              attempt.score || 0,
              test.mouStartDate || "N/A",
              test.mouEndDate || "N/A"
            )
          );
        }

        // 3. Send Professional Email
        if (channels.email && application.email) {
          notifications.push(
            sendMOUEmail({
              to: application.email,
              candidateName: application.candidateName || "Candidate",
              applicationNo: application.applicationNumber || "N/A",
              marks: attempt.score || 0,
              mouStart: test.mouStartDate || "N/A",
              mouEnd: test.mouEndDate || "N/A"
            })
          );
        }

        // Wait for all channels for THIS candidate
        await Promise.allSettled(notifications);

        // Update database with success status
        await Attempt.findByIdAndUpdate(attempt._id, {
          notificationStatus: "Sent",
          lastNotifiedAt: new Date()
        });

        stats.sent++;

        // Small delay between candidates (100ms) to be safe with API providers
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.error(`Error notifying candidate ${application.mobile}:`, err);
        stats.failed++;
      }
    }

    res.json({
      success: true,
      data: {
        stats,
        message: `Processed ${attempts.length} candidates. Sent: ${stats.sent}, Failed: ${stats.failed}`
      }
    });

  } catch (error) {
    console.error("Bulk MOU Notification Error:", error);
    res.status(500).json({ error: "Failed to send notifications" });
  }
});

/**
 * POST /api/create-paper/test/whatsapp
 * Admin test route for WhatsApp API
 */
router.post("/test/whatsapp", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { mobile, name, appId, startDate, endDate, templateName } = req.body;

    if (!mobile) {
      return res.status(400).json({ error: "Mobile number is required" });
    }

    const result = await sendMOUProcessWhatsApp(
      mobile,
      name || "Test User",
      appId || "JSSA-TEST-001",
      startDate || "10/04/2026",
      endDate || "20/04/2026",
      templateName
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/create-paper/bulk-update-mou
 * Update MOU dates for multiple tests at once
 */
router.post("/bulk-update-mou", authenticate, async (req, res) => {
  try {
    const { testIds, mouStartDate, mouEndDate } = req.body;

    if (!Array.isArray(testIds) || testIds.length === 0) {
      return res.status(400).json({ success: false, error: "No test IDs provided" });
    }

    const updateData = {
      mouStartDate: mouStartDate || "",
      mouEndDate: mouEndDate || "",
    };

    const result = await CreatePaper.updateMany(
      { _id: { $in: testIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} exams.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Bulk update MOU dates error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update MOU dates in bulk",
      message: error.message
    });
  }
});

/**
 * GET /api/create-paper/mou/filter-counts
 * Get dynamically computed counts of candidates by state, district, and designation for MOU page
 */
router.get("/mou/filter-counts", authenticate, async (req, res) => {
  try {
    const { state, district } = req.query;

    const baseMatch = [
      {
        $lookup: {
          from: "createpapers",
          localField: "testId",
          foreignField: "_id",
          as: "testInfo"
        }
      },
      { $unwind: "$testInfo" },
      {
        $match: {
          $expr: { $gte: ["$score", { $ifNull: ["$testInfo.passingMarks", 0] }] }
        }
      },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "_id",
          as: "appInfo"
        }
      },
      { $unwind: "$appInfo" },
      {
        $lookup: {
          from: "jobpostings",
          localField: "appInfo.jobPostingId",
          foreignField: "_id",
          as: "jobInfo"
        }
      },
      { $unwind: { path: "$jobInfo", preserveNullAndEmptyArrays: true } }
    ];

    const facetPipeline = [
      ...baseMatch,
      {
        $facet: {
          states: [
            { $group: { _id: "$appInfo.state", count: { $sum: 1 } } }
          ],
          districts: [
            ...(state ? [{ $match: { "appInfo.state": state } }] : []),
            { $group: { _id: "$appInfo.district", count: { $sum: 1 } } }
          ],
          designations: [
            ...(state ? [{ $match: { "appInfo.state": state } }] : []),
            ...(district ? [{ $match: { "appInfo.district": district } }] : []),
            { $group: { _id: "$jobInfo.post.en", count: { $sum: 1 } } }
          ]
        }
      }
    ];

    const facetResult = await Attempt.aggregate(facetPipeline).allowDiskUse(true);
    const result = facetResult[0] || { states: [], districts: [], designations: [] };

    const states = {};
    result.states.forEach(item => {
      if (item._id) states[item._id] = item.count;
    });

    const districts = {};
    result.districts.forEach(item => {
      if (item._id) districts[item._id] = item.count;
    });

    const designations = { DM: 0, BS: 0, PE: 0 };
    result.designations.forEach(item => {
      if (!item._id) return;
      const title = item._id.toLowerCase();
      if (title.includes("district manager") || title.includes("dm")) {
        designations.DM += item.count;
      } else if (title.includes("block supervisor") || title.includes("bs")) {
        designations.BS += item.count;
      } else if (title.includes("panchayat executive") || title.includes("pe")) {
        designations.PE += item.count;
      }
    });

    res.json({
      success: true,
      data: { states, districts, designations }
    });
  } catch (error) {
    console.error("Fetch MOU filter counts error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch filter counts" });
  }
});

// --- MANUAL CANDIDATE ADDITION ---

/**
 * POST /api/create-paper/search-candidate
 * Search for a candidate by Mobile No or Email in the Application collection.
 */
router.post("/search-candidate", authenticate, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, error: "Search query is required" });

    const candidates = await Application.find({
      $or: [
        { mobile: query.trim() },
        { email: new RegExp(`^${query.trim()}$`, "i") }
      ]
    }).select("_id candidateName email mobile applicationStatus profilePic").limit(5).lean();

    if (!candidates || candidates.length === 0) {
      return res.json({ success: false, error: "No candidate found with this mobile or email." });
    }

    // Attach last exam status
    for (let c of candidates) {
      const lastAttempt = await Attempt.findOne({ applicationId: c._id })
        .sort({ createdAt: -1 })
        .populate("testId", "title passingMarks");

      if (lastAttempt && lastAttempt.testId) {
        const passMarks = lastAttempt.testId.passingMarks || 0;
        const isPass = lastAttempt.score >= passMarks;
        c.lastExamStatus = isPass ? "Pass" : "Fail";
        c.lastExamName = lastAttempt.testId.title;
      } else {
        c.lastExamStatus = "No Attempts";
        c.lastExamName = "N/A";
      }
    }

    res.json({ success: true, data: candidates });
  } catch (error) {
    console.error("Error searching candidate:", error);
    res.status(500).json({ success: false, error: "Internal server error during search" });
  }
});

/**
 * POST /api/create-paper/:id/add-candidate
 * Manually add an existing candidate (applicationId) to this specific exam.
 */
router.post("/:id/add-candidate", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { applicationId } = req.body;

    if (!applicationId) return res.status(400).json({ success: false, error: "Application ID is required" });

    const paper = await CreatePaper.findById(id);
    if (!paper) return res.status(404).json({ success: false, error: "Exam not found" });

    const alreadyAssigned = paper.assignedStudents.some(
      (studentId) => studentId.toString() === applicationId.toString()
    );

    if (alreadyAssigned) {
      return res.json({ success: false, error: "Candidate is already assigned to this exam." });
    }

    paper.assignedStudents.push(applicationId);
    await paper.save();

    res.json({ success: true, message: "Candidate successfully added to the exam!" });
  } catch (error) {
    console.error("Error adding candidate manually:", error);
    res.status(500).json({ success: false, error: "Internal server error while adding candidate" });
  }
});

export default router;
