import CalculatorLog from "../models/CalculatorLog.js";

/**
 * POST /api/calculator/log
 * Save a calculation record for the authenticated CardHolder.
 */
export const logCalculation = async (req, res) => {
  try {
    const { calculatorType, inputs, result, cardId } = req.body;

    if (!calculatorType || !inputs || !result) {
      return res
        .status(400)
        .json({ success: false, error: "calculatorType, inputs, and result are required." });
    }

    const allowedTypes = ["BMI", "DailyCalorie", "IdealWeight", "StepGoal"];
    if (!allowedTypes.includes(calculatorType)) {
      return res.status(400).json({ success: false, error: "Invalid calculatorType." });
    }

    const log = await CalculatorLog.create({
      user: req.user.id,
      cardId: cardId || null,
      calculatorType,
      inputs,
      result,
    });

    return res.status(201).json({ success: true, data: log });
  } catch (err) {
    console.error("Calculator Log Error:", err);
    return res.status(500).json({ success: false, error: "Failed to save calculation." });
  }
};

/**
 * GET /api/calculator/my-history
 * Fetch the authenticated user's past calculations (latest 50).
 */
export const getMyHistory = async (req, res) => {
  try {
    const logs = await CalculatorLog.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error("Calculator History Error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch history." });
  }
};

/**
 * GET /api/calculator/admin-report
 * Admin: aggregate usage stats across all users.
 */
export const getAdminReport = async (req, res) => {
  try {
    const summary = await CalculatorLog.aggregate([
      {
        $group: {
          _id: "$calculatorType",
          totalUses: { $sum: 1 },
          uniqueUsers: { $addToSet: "$user" },
          lastUsed: { $max: "$createdAt" },
        },
      },
      {
        $project: {
          calculatorType: "$_id",
          totalUses: 1,
          uniqueUserCount: { $size: "$uniqueUsers" },
          lastUsed: 1,
          _id: 0,
        },
      },
      { $sort: { totalUses: -1 } },
    ]);

    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error("Calculator Admin Report Error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch report." });
  }
};
