import express from "express";
import mongoose from "mongoose";
const router = express.Router();
import Review from "../models/Review.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";

/**
 * @route   GET /api/reviews/superiors
 * @desc    Get list of superiors available to review
 */
router.get("/superiors", authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    let superiors = [];
    let currentReportingId = employee.reportingTo;
    let visited = new Set(); // Prevent circular loops

    while (currentReportingId && !visited.has(currentReportingId.toString())) {
      visited.add(currentReportingId.toString());
      const superior = await Employee.findOne({ userId: currentReportingId })
        .populate("userId", "name email phone photo")
        .select("name role designation userId photo");

      if (superior) {
        // Check if already reviewed in the last 30 days
        const lastReview = await Review.findOne({
          reviewerId: req.user.id,
          targetId: superior.userId._id,
          createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        superiors.push({
          ...superior.toObject(),
          lastReviewDate: lastReview ? lastReview.createdAt : null,
          canReview: !lastReview
        });

        currentReportingId = superior.reportingTo;
      } else {
        break;
      }
    }

    res.json({ success: true, data: superiors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/reviews
 * @desc    Submit a review
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { targetId, rating, comment } = req.body;

    if (!targetId || !rating) {
      return res.status(400).json({ success: false, message: "Target and rating are required" });
    }

    // Validation: Check if reviewed in last 30 days
    const lastReview = await Review.findOne({
      reviewerId: req.user.id,
      targetId: targetId,
      createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (lastReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this person in the last 7 days" });
    }

    const review = new Review({
      reviewerId: req.user.id,
      targetId,
      rating,
      comment
    });

    await review.save();
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/reviews/received
 * @desc    Get reviews received by current employee
 */
router.get("/received", authenticate, async (req, res) => {
  try {
    const pipeline = [
      { $match: { targetId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $lookup: {
          from: "employees",
          localField: "reviewerId",
          foreignField: "userId",
          as: "reviewerProfile"
        }
      },
      { $unwind: { path: "$reviewerProfile", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "reviewerId",
          foreignField: "_id",
          as: "reviewerUser"
        }
      },
      { $unwind: { path: "$reviewerUser", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          createdAt: 1,
          reviewerId: {
            _id: "$reviewerId",
            name: { $ifNull: ["$reviewerProfile.name", "$reviewerUser.name", "Unknown"] },
            role: { $ifNull: ["$reviewerProfile.role", "$reviewerUser.role", "EMPLOYEE"] },
            designation: { $ifNull: ["$reviewerProfile.designation", "Staff Member"] },
            photo: { $ifNull: ["$reviewerProfile.photo", "$reviewerUser.photo", null] }
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    const reviews = await Review.aggregate(pipeline);

    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({ 
      success: true, 
      data: reviews,
      stats: {
        average: parseFloat(avgRating),
        total: reviews.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/reviews/all
 * @desc    Get all reviews (Admin only)
 */
router.get("/all", authenticate, authorize(["admin", "superadmin", "staff"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: { status: "Active" } },
      // Lookup Reviewer Employee Profile
      {
        $lookup: {
          from: "employees",
          localField: "reviewerId",
          foreignField: "userId",
          as: "reviewerProfile"
        }
      },
      { $unwind: { path: "$reviewerProfile", preserveNullAndEmptyArrays: true } },
      // Lookup Target Employee Profile
      {
        $lookup: {
          from: "employees",
          localField: "targetId",
          foreignField: "userId",
          as: "targetProfile"
        }
      },
      { $unwind: { path: "$targetProfile", preserveNullAndEmptyArrays: true } },
      // Lookup Reviewer User Profile (for Role fallback)
      {
        $lookup: {
          from: "users",
          localField: "reviewerId",
          foreignField: "_id",
          as: "reviewerUser"
        }
      },
      { $unwind: { path: "$reviewerUser", preserveNullAndEmptyArrays: true } },
      // Lookup Target User Profile (for Role fallback)
      {
        $lookup: {
          from: "users",
          localField: "targetId",
          foreignField: "_id",
          as: "targetUser"
        }
      },
      { $unwind: { path: "$targetUser", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          createdAt: 1,
          reviewerId: {
            _id: "$reviewerId",
            name: { $ifNull: ["$reviewerProfile.name", "$reviewerUser.name", "Unknown"] },
            role: { $ifNull: ["$reviewerProfile.role", "$reviewerUser.role", "EMPLOYEE"] },
            designation: { $ifNull: ["$reviewerProfile.designation", "Staff Member"] },
            photo: { $ifNull: ["$reviewerProfile.photo", "$reviewerUser.photo", null] }
          },
          targetId: {
            _id: "$targetId",
            name: { $ifNull: ["$targetProfile.name", "$targetUser.name", "Unknown"] },
            role: { $ifNull: ["$targetProfile.role", "$targetUser.role", "EMPLOYEE"] },
            designation: { $ifNull: ["$targetProfile.designation", "Manager"] },
            photo: { $ifNull: ["$targetProfile.photo", "$targetUser.photo", null] }
          }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const total = await Review.countDocuments({ status: "Active" });
    const reviews = await Review.aggregate(pipeline);

    res.json({ 
      success: true, 
      data: reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
