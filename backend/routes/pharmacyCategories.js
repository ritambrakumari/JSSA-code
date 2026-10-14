import express from "express";
const router = express.Router();
import PharmacyCategory from "../models/PharmacyCategory.js";
import Pharmacy from "../models/Pharmacy.js";
import { authenticate, authorize } from "../middleware/auth.js";

// Helper to get pharmacy ID for the logged-in user
const getPharmacyId = async (userId) => {
  const pharmacy = await Pharmacy.findOne({ userId });
  return pharmacy ? pharmacy._id : null;
};

// @desc    Get all categories for the logged-in pharmacy
// @route   GET /api/pharmacy-categories
// @access  Private (Pharmacy)
router.get("/", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacyId = await getPharmacyId(req.user.id);
    if (!pharmacyId) return res.status(404).json({ error: "Pharmacy not found" });

    const { page, limit, search, status } = req.query;
    
    let filter = { pharmacyId };
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const query = PharmacyCategory.find(filter).sort({ createdAt: -1 });
    const totalCategories = await PharmacyCategory.countDocuments(filter);

    let categories;
    if (page && limit) {
      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 10;
      const skip = (pageNumber - 1) * limitNumber;
      categories = await query.skip(skip).limit(limitNumber);

      res.json({
        success: true,
        categories,
        totalCategories,
        totalPages: Math.ceil(totalCategories / limitNumber),
        currentPage: pageNumber
      });
    } else {
      categories = await query;
      res.json({ success: true, categories, totalCategories, totalPages: 1, currentPage: 1 });
    }
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Create a category
// @route   POST /api/pharmacy-categories
// @access  Private (Pharmacy)
router.post("/", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacyId = await getPharmacyId(req.user.id);
    if (!pharmacyId) return res.status(404).json({ error: "Pharmacy not found" });

    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const newCategory = new PharmacyCategory({
      pharmacyId,
      name,
      description,
      status: status || "Active"
    });

    await newCategory.save();
    res.status(201).json({ success: true, category: newCategory, message: "Category created successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Category with this name already exists" });
    }
    console.error("Create category error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Update a category
// @route   PUT /api/pharmacy-categories/:id
// @access  Private (Pharmacy)
router.put("/:id", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacyId = await getPharmacyId(req.user.id);
    if (!pharmacyId) return res.status(404).json({ error: "Pharmacy not found" });

    const { name, description, status } = req.body;

    const category = await PharmacyCategory.findOne({ _id: req.params.id, pharmacyId });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (status) category.status = status;

    await category.save();
    res.json({ success: true, category, message: "Category updated successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Category with this name already exists" });
    }
    console.error("Update category error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Delete a category
// @route   DELETE /api/pharmacy-categories/:id
// @access  Private (Pharmacy)
router.delete("/:id", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacyId = await getPharmacyId(req.user.id);
    if (!pharmacyId) return res.status(404).json({ error: "Pharmacy not found" });

    const category = await PharmacyCategory.findOneAndDelete({ _id: req.params.id, pharmacyId });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
