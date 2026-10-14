import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema({
  cardPrice: {
    type: Number,
    required: true,
    default: 150
  },
  commissions: {
    PE: { type: Number, default: 50 },
    BS: { type: Number, default: 100 },
    DM: { type: Number, default: 150 }
  },
  isWithdrawalEnabled: {
    type: Boolean,
    default: true
  },
  referralBonusAmount: {
    type: Number,
    default: 0
  },
  pharmacyDiscountPercent: {
    type: Number,
    default: 10
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Ensure only one config document exists
const SystemConfig = mongoose.model("SystemConfig", systemConfigSchema);
export default SystemConfig;
