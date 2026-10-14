import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestType: {
      type: String,
      enum: ["Employee", "Staff"],
      default: "Employee",
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Withdrawal amount must be at least 1"],
    },
    bankDetails: {
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
      accountHolderName: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing", "success", "failed", "refunded"],
      default: "pending",
    },
    payoutId: {
      type: String, // Razorpay Payout ID
    },
    failureReason: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    processedAt: {
      type: Date,
    },
    otherExpenses: {
      type: Number,
      default: 0,
    },
    adminRemark: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ["manual", "razorpay"],
      default: "manual",
    },
  },
  { timestamps: true }
);

// Indexing for faster lookups in admin panel
withdrawalRequestSchema.index({ status: 1 });
withdrawalRequestSchema.index({ employeeId: 1 });

const WithdrawalRequest = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);

export default WithdrawalRequest;
