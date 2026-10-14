import mongoose from "mongoose";

const payoutHistorySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    payoutId: {
      type: String, // Razorpay Payout ID
      required: true,
      unique: true,
    },
    fundAccountId: {
      type: String, // Razorpay Fund Account ID
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "processed", "reversed", "rejected", "failed"],
      default: "pending",
    },
    remarks: {
      type: String,
      trim: true,
    },
    failureReason: {
      type: String,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who initiated
      required: true,
    },
  },
  { timestamps: true }
);

const PayoutHistory = mongoose.model("PayoutHistory", payoutHistorySchema);

export default PayoutHistory;
