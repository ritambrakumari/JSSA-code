import express from "express";
const router = express.Router();
import PharmacyProduct from "../models/PharmacyProduct.js";
import Pharmacy from "../models/Pharmacy.js";
import { authenticate, authorize } from "../middleware/auth.js";

// Helper to get pharmacy ID for the logged-in user
const getPharmacyId = async (userId) => {
  const pharmacy = await Pharmacy.findOne({ userId });
  return pharmacy ? pharmacy._id : null;
};

// @desc    Search all active pharmacy products (For Doctors)
// @route   GET /api/pharmacy-products/search
// @access  Private (Doctor)
router.get("/search", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { q } = req.query;
    if (!q) {
      return res.json({ success: true, products: [] });
    }

    // Standard search
    const standardRegex = new RegExp(q, "i");
    
    // Typo-tolerant (Fuzzy) search: insert .* between each letter, ignoring spaces
    // e.g., "para" -> "p.*a.*r.*a"
    const fuzzyQuery = q.replace(/\s+/g, '').split('').join('.*');
    const fuzzyRegex = new RegExp(fuzzyQuery, "i");

    const products = await PharmacyProduct.find({
      $or: [
        { name: standardRegex },
        { name: fuzzyRegex }
      ],
      status: "Active"
    })
      .populate("pharmacyId", "shopName name shopAddress")
      .limit(10); // Limit results for autocomplete

    res.json({ success: true, products });
  } catch (error) {
    console.error("Search products error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Get all products for the logged-in pharmacy
// @route   GET /api/pharmacy-products
// @access  Private (Pharmacy)
router.get("/", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacyId = await getPharmacyId(req.user.id);
    if (!pharmacyId) return res.status(404).json({ error: "Pharmacy not found" });

    const { page, limit, search, categoryId, status } = req.query;

    const filter = { pharmacyId };
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const query = PharmacyProduct.find(filter)
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });
    const totalProducts = await PharmacyProduct.countDocuments(filter);

    let products;
    if (page && limit) {
      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 10;
      const skip = (pageNumber - 1) * limitNumber;
      products = await query.skip(skip).limit(limitNumber);

      res.json({
        success: true,
        products,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limitNumber),
        currentPage: pageNumber
      });
    } else {
      products = await query;
      res.json({ success: true, products, totalProducts, totalPages: 1, currentPage: 1 });
    }
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Create a product
// @route   POST /api/pharmacy-products
// @access  Private (Pharmacy)
router.post("/", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacyId = await getPharmacyId(req.user.id);
    if (!pharmacyId) return res.status(404).json({ error: "Pharmacy not found" });

    const { name, categoryId, price, stock, description, status } = req.body;

    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ error: "Name, category, and price are required" });
    }

    let finalStatus = status || "Active";
    if (Number(stock || 0) === 0) {
      finalStatus = "Out of Stock";
    }

    const newProduct = new PharmacyProduct({
      pharmacyId,
      categoryId,
      name,
      price,
      stock: stock || 0,
      description,
      status: finalStatus
    });

    await newProduct.save();
    
    // Populate category for response
    await newProduct.populate("categoryId", "name");

    res.status(201).json({ success: true, product: newProduct, message: "Product created successfully" });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Update a product
// @route   PUT /api/pharmacy-products/:id
// @access  Private (Pharmacy)
router.put("/:id", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacyId = await getPharmacyId(req.user.id);
    if (!pharmacyId) return res.status(404).json({ error: "Pharmacy not found" });

    const { name, categoryId, price, stock, description, status } = req.body;

    const product = await PharmacyProduct.findOne({ _id: req.params.id, pharmacyId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (name) product.name = name;
    if (categoryId) product.categoryId = categoryId;
    if (price !== undefined) product.price = price;
    
    // Status resolution
    let finalStatus = status || product.status;
    let finalStock = stock !== undefined ? Number(stock) : product.stock;
    
    if (finalStock <= 0) {
      finalStatus = "Out of Stock";
    } else if (finalStock > 0 && finalStatus === "Out of Stock") {
      finalStatus = "Active";
    }
    
    if (stock !== undefined) product.stock = finalStock;
    if (description !== undefined) product.description = description;
    product.status = finalStatus;

    await product.save();
    await product.populate("categoryId", "name");

    res.json({ success: true, product, message: "Product updated successfully" });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @desc    Delete a product
// @route   DELETE /api/pharmacy-products/:id
// @access  Private (Pharmacy)
router.delete("/:id", authenticate, authorize(["pharmacy"]), async (req, res) => {
  try {
    const pharmacyId = await getPharmacyId(req.user.id);
    if (!pharmacyId) return res.status(404).json({ error: "Pharmacy not found" });

    const product = await PharmacyProduct.findOneAndDelete({ _id: req.params.id, pharmacyId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
