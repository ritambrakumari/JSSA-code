import express from "express";
import Feed from "../models/Feed.js";
import { authenticate, authorize } from "../middleware/auth.js";

import Employee from "../models/Employee.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * @route POST /api/feeds/create
 * @desc Create a new feed (Employee)
 */
router.post("/create", authenticate, async (req, res) => {
  try {
    const { text, image, images } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Post text is required" });
    }

    const newFeed = new Feed({
      text,
      image,
      images: images || [],
      author: req.user.id,
      status: "Pending"
    });

    await newFeed.save();

    res.status(201).json({
      success: true,
      message: "Feed submitted for approval",
      data: newFeed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/feeds/my-feeds
 * @desc Get feeds created by current user
 */
router.get("/my-feeds", authenticate, async (req, res) => {
  try {
    const feeds = await Feed.find({ author: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: feeds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/feeds/public
 * @desc Get all approved feeds for the feed wall
 */
router.get("/public", authenticate, async (req, res) => {
  try {
    const feeds = await Feed.find({ status: "Approved" })
      .populate("author", "name email photo")
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with employee photo/name
    const enrichedFeeds = await Promise.all(feeds.map(async (feed) => {
      if (feed.author) {
        const emp = await Employee.findOne({ userId: feed.author._id }).select("name photo");
        if (emp) {
          feed.author.name = feed.author.name || emp.name;
          feed.author.photo = feed.author.photo || emp.photo;
        }
      }
      return feed;
    }));

    res.json({ success: true, data: enrichedFeeds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/feeds/public/all
 * @desc Get all approved feeds for the feed wall without authentication
 */
router.get("/public/all", async (req, res) => {
  try {
    const { page, limit } = req.query;
    const isPaginated = page && limit;
    const pageNum = isPaginated ? parseInt(page) : 1;
    const limitNum = isPaginated ? parseInt(limit) : (limit ? parseInt(limit) : 0);
    const skipNum = (pageNum - 1) * limitNum;

    let feedsQuery = Feed.find({ status: "Approved" })
      .populate("author", "name email photo")
      .sort({ createdAt: -1 })
      .lean();

    if (isPaginated) {
      feedsQuery = feedsQuery.skip(skipNum).limit(limitNum);
    } else if (limitNum > 0) {
      feedsQuery = feedsQuery.limit(limitNum);
    }

    const feeds = await feedsQuery;

    // Enrich with employee photo/name
    const enrichedFeeds = await Promise.all(feeds.map(async (feed) => {
      if (feed.author) {
        const emp = await Employee.findOne({ userId: feed.author._id }).select("name photo");
        if (emp) {
          feed.author.name = feed.author.name || emp.name;
          feed.author.photo = feed.author.photo || emp.photo;
        }
      }
      return feed;
    }));

    const response = { success: true, data: enrichedFeeds };

    if (isPaginated) {
      const total = await Feed.countDocuments({ status: "Approved" });
      response.pagination = {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      };
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/feeds/admin/all
 * @desc Get all feeds for admin management
 */
router.get("/admin/all", authenticate, authorize("admin", "staff"), async (req, res) => {
  try {
    const { page = 1, limit = 15, status = "all", search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const matchQuery = {};
    if (status && status !== "all") {
      matchQuery.status = status;
    }

    if (search && search.trim()) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");

      const matchingEmployees = await Employee.find({
        name: { $regex: search, $options: "i" }
      }).select("userId");

      const matchingUserIds = [
        ...matchingUsers.map(u => u._id),
        ...matchingEmployees.map(e => e.userId).filter(Boolean)
      ];

      matchQuery.$or = [
        { text: { $regex: search, $options: "i" } },
        { author: { $in: matchingUserIds } }
      ];
    }

    const total = await Feed.countDocuments(matchQuery);

    const feeds = await Feed.find(matchQuery)
      .populate("author", "name email photo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Enrich with employee photo/name
    const enrichedFeeds = await Promise.all(feeds.map(async (feed) => {
      if (feed.author) {
        const emp = await Employee.findOne({ userId: feed.author._id }).select("name photo");
        if (emp) {
          feed.author.name = feed.author.name || emp.name;
          feed.author.photo = feed.author.photo || emp.photo;
        }
      }
      return feed;
    }));

    // Calculate global stats (total, pending, approved, rejected)
    const [totalStats, pendingStats, approvedStats, rejectedStats] = await Promise.all([
      Feed.countDocuments(),
      Feed.countDocuments({ status: "Pending" }),
      Feed.countDocuments({ status: "Approved" }),
      Feed.countDocuments({ status: "Rejected" })
    ]);

    const stats = {
      total: totalStats,
      pending: pendingStats,
      approved: approvedStats,
      rejected: rejectedStats
    };

    res.json({
      success: true,
      data: enrichedFeeds,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route PATCH /api/feeds/admin/status/:id
 * @desc Approve or Reject a feed
 */
router.patch("/admin/status/:id", authenticate, authorize("admin", "staff"), async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const feed = await Feed.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminRemarks,
        processedAt: new Date()
      },
      { new: true }
    );

    if (!feed) return res.status(404).json({ error: "Feed not found" });

    res.json({ success: true, message: `Feed ${status.toLowerCase()} successfully`, data: feed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/admin/edit/:id", authenticate, authorize("admin", "staff"), async (req, res) => {
  try {
    const { text, image, images } = req.body;

    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (image !== undefined) updateData.image = image;
    if (images !== undefined) updateData.images = images;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update provided" });
    }

    const feed = await Feed.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("author", "name email photo").lean();

    if (!feed) return res.status(404).json({ error: "Feed not found" });

    if (feed.author) {
      const emp = await Employee.findOne({ userId: feed.author._id }).select("name photo");
      if (emp) {
        feed.author.name = feed.author.name || emp.name;
        feed.author.photo = feed.author.photo || emp.photo;
      }
    }

    res.json({ success: true, message: "Feed updated successfully", data: feed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route POST /api/feeds/like/:id
 * @desc Toggle like on a feed
 */
router.post("/like/:id", authenticate, async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) return res.status(404).json({ error: "Feed not found" });

    const index = feed.likes.indexOf(req.user.id);
    if (index === -1) {
      feed.likes.push(req.user.id);
    } else {
      feed.likes.splice(index, 1);
    }

    await feed.save();
    res.json({ success: true, likes: feed.likes, isLiked: index === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route DELETE /api/feeds/admin/:id
 * @desc Delete a feed completely (Admin only)
 */
router.delete("/admin/:id", authenticate, authorize("admin", "staff"), async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) {
      return res.status(404).json({ error: "Feed not found" });
    }

    await feed.deleteOne();
    res.json({ success: true, message: "Feed deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
