import mongoose from "mongoose";

const calculatorLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Friendly card ID if available
    cardId: { type: String, default: null },

    calculatorType: {
      type: String,
      enum: ["BMI", "DailyCalorie", "IdealWeight", "StepGoal"],
      required: true,
    },

    // Raw inputs the user provided
    inputs: { type: Object, required: true },

    // Computed result
    result: { type: Object, required: true },
  },
  { timestamps: true }
);

const CalculatorLog = mongoose.model("CalculatorLog", calculatorLogSchema);
export default CalculatorLog;
