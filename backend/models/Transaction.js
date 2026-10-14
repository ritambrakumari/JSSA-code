import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
      index: true
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdministrativeStaff",
      required: false,
      index: true
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["CREDIT_ONLINE", "CREDIT_ADMIN", "CREDIT_COMMISSION", "CREDIT_LEAD", "DEBIT_CARD_ISSUE", "DEBIT_SYSTEM"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    razorpay_order_id: {
      type: String,
      index: true
    },
    razorpay_payment_id: {
      type: String,
      index: true,
      unique: true,
      sparse: true // Allows multiple nulls for non-razorpay transactions
    },
    razorpay_signature: {
      type: String,
    },
    remarks: {
      type: String,
    },
    metadata: {
      type: Object,
    }
  },
  {
    timestamps: true,
  }
);

// Index for chronological history
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
