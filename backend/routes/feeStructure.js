import express from "express";
import FeeStructure from "../models/FeeStructure.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all fee structures
router.get("/", authenticate, async (req, res) => {
  try {
    const fees = await FeeStructure.find();
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new fee structure
router.post("/", authenticate, async (req, res) => {
  try {
    const { jobPost, trainingFee, idCardFee, softwareFee, mouFee } = req.body;
    const totalAmount = Number(trainingFee) + Number(idCardFee) + Number(softwareFee) + Number(mouFee);
    
    // Check if jobPost already has a fee structure
    const existing = await FeeStructure.findOne({ jobPost });
    if (existing) {
      return res.status(400).json({ success: false, error: "Fee structure already exists for this job post" });
    }

    const newFee = new FeeStructure({
      jobPost,
      trainingFee,
      idCardFee,
      softwareFee,
      mouFee,
      totalAmount
    });

    await newFee.save();
    res.status(201).json({ success: true, data: newFee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update fee structure
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { trainingFee, idCardFee, softwareFee, mouFee, status } = req.body;
    const totalAmount = Number(trainingFee) + Number(idCardFee) + Number(softwareFee) + Number(mouFee);

    const updated = await FeeStructure.findByIdAndUpdate(
      req.params.id,
      { trainingFee, idCardFee, softwareFee, mouFee, totalAmount, status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: "Fee structure not found" });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete fee structure
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const deleted = await FeeStructure.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Fee structure not found" });
    }
    res.json({ success: true, message: "Fee structure deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
