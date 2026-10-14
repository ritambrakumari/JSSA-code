import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema({
  jobPost: {
    type: String,
    required: true,
    unique: true
  },
  trainingFee: { type: Number, default: 800 },
  idCardFee: { type: Number, default: 100 },
  softwareFee: { type: Number, default: 640 },
  mouFee: { type: Number, default: 250 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

export default mongoose.model("FeeStructure", feeStructureSchema);
