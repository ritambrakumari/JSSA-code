import express from "express";
import { authenticate } from "../middleware/auth.js";
import Application from "../models/Application.js";
import JobPosting from "../models/JobPosting.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * GET /api/dashboard/public-counts
 * Public counters for the landing page (no personal data).
 */
router.get("/public-counts", async (req, res) => {
  try {
    const registeredUsers = await User.countDocuments({
      role: { $nin: ["admin", "superadmin", "staff"] },
    });
    res.json({ success: true, data: { registeredUsers } });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch counts", message: error.message });
  }
});

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const { role } = req.user;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get yesterday's date range
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Build query based on role
    let applicationQuery = {};
    if (role === "applicant") {
      applicationQuery.createdBy = req.user.id;
    }

    // Total applications
    const totalApplications = await Application.countDocuments(applicationQuery);

    // Total paid applications
    const totalPaidApplications = await Application.countDocuments({
      ...applicationQuery,
      paymentStatus: "paid"
    });

    // Applications today
    const applicationsToday = await Application.countDocuments({
      ...applicationQuery,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Applications yesterday (for percentage calculation)
    const applicationsYesterday = await Application.countDocuments({
      ...applicationQuery,
      createdAt: { $gte: yesterday, $lt: today },
    });

    // Calculate percentage change
    const todayChange =
      applicationsYesterday > 0
        ? (((applicationsToday - applicationsYesterday) / applicationsYesterday) * 100).toFixed(0)
        : applicationsToday > 0
          ? "100"
          : "0";

    // Total job postings
    const totalJobPostings = await JobPosting.countDocuments({});

    // Active job postings
    const activeJobPostings = await JobPosting.countDocuments({
      status: "Active",
    });

    // Get applications by payment status
    const applicationsByPaymentStatus = await Application.aggregate([
      { $match: applicationQuery },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const paymentStatusMap = {};
    applicationsByPaymentStatus.forEach((item) => {
      const status = item._id || "pending";
      paymentStatusMap[status] = item.count;
    });

    // Get monthly application data for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyData = await Application.aggregate([
      {
        $match: {
          ...applicationQuery,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Format monthly data
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const enrollmentData = monthlyData.map((item) => ({
      month: monthNames[item._id.month - 1],
      applicants: item.count,
    }));

    // Get recent applications (last 5)
    const recentApplications = await Application.find(applicationQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("jobPostingId", "advtNo post")
      .select("candidateName district status createdAt jobPostingId paymentStatus");

    // Calculate approval rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentApplicationsForRate = await Application.countDocuments({
      ...applicationQuery,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const approvedRecent = await Application.countDocuments({
      ...applicationQuery,
      status: "Approved",
      createdAt: { $gte: thirtyDaysAgo },
    });

    const approvalRate =
      recentApplicationsForRate > 0
        ? ((approvedRecent / recentApplicationsForRate) * 100).toFixed(0)
        : "0";

    // Get applications by district (for distribution)
    const districtData = await Application.aggregate([
      { $match: applicationQuery },
      {
        $group: {
          _id: "$district",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Format response
    res.json({
      success: true,
      data: {
        stats: {
          totalApplications: totalApplications,
          totalPaidApplications: totalPaidApplications,
          applicationsToday: applicationsToday,
          todayChange: todayChange,
          totalJobPostings: totalJobPostings,
          activeJobPostings: activeJobPostings,
          approvalRate: approvalRate,
        },
        enrollmentData: enrollmentData,
        recentApplications: recentApplications.map((app) => ({
          id: app._id,
          name: app.candidateName,
          district: app.district,
          service: app.jobPostingId
            ? app.jobPostingId.post?.en || app.jobPostingId.post || "N/A"
            : "General",
          status: app.status || "Pending",
          paymentStatus: app.paymentStatus || "pending",
          createdAt: app.createdAt,
        })),
        statusDistribution: paymentStatusMap,
        districtDistribution: districtData,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard statistics",
      message: error.message,
    });
  }
});

export default router;
