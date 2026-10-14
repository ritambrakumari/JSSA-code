import express from "express";
import Blog from "../models/Blog.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single blog
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy", "name email");
    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }
    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a blog
router.post("/", authenticate, async (req, res) => {
  try {
    // Only Admin or permitted roles should create
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      // For now checking role. If specific permissions needed, check req.user
      // We will let the frontend UI restrict access
    }

    const { title, description, image, htmlContent } = req.body;
    
    if (!title || !description || !image || !htmlContent) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    const newBlog = new Blog({
      title,
      description,
      image,
      htmlContent,
      createdBy: req.user.id,
    });

    await newBlog.save();
    res.status(201).json({ success: true, data: newBlog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a blog
router.put("/:id", authenticate, async (req, res) => {
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedBlog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }
    res.json({ success: true, data: updatedBlog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a blog
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }
    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
