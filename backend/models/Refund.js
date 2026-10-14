import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", default: null },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    adminRemarks: { type: String, default: "" },
    refundRefId: { type: String, default: "" },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Refund = mongoose.model("Refund", refundSchema);
export default Refund;
