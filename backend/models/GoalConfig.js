import mongoose from "mongoose";

const goalConfigSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["PE", "BS", "DM", "ZC", "RM"],
      required: true,
      unique: true,
    },
    // Recharge Permissions
    rechargeAllowed: {
      type: Boolean,
      default: true,
    },
    minRechargeAmount: {
      type: Number,
      default: 100,
    },
    // Card Creation Targets
    cardTargetEnabled: {
      type: Boolean,
      default: false,
    },
    monthlyCardTarget: {
      type: Number,
      default: 0, // Individual target
    },
    teamCardTargetEnabled: {
      type: Boolean,
      default: false,
    },
    monthlyTeamCardTarget: {
      type: Number,
      default: 0, // Combined team target (Legacy)
    },
    layeredTargets: [
      {
        roleName: { type: String }, // e.g., "District Manager"
        target: { type: Number, default: 0 }
      }
    ],
    // Commission Settings
    individualCommission: {
      type: Number,
      default: 0, // Amount earned for card issued by themselves
    },
    baseSalary: {
      type: Number,
      default: 0,
    },
    stateSalaries: [
      {
        state: { type: String },
        salary: { type: Number, default: 0 }
      }
    ],
    layeredCommissions: [
      {
        roleName: { type: String }, // e.g., "Panchayat Executive"
        commission: { type: Number, default: 0 } // Amount earned from this subordinate's cards
      }
    ],
    // Lead Upload Targets
    leadTargetEnabled: {
      type: Boolean,
      default: false,
    },
    monthlyLeadTarget: {
      type: Number,
      default: 0,
    },
    // Lead Earning Settings
    leadEarningEnabled: {
      type: Boolean,
      default: false,
    },
    individualLeadEarning: {
      type: Number,
      default: 0,
    },
    attendanceEnabled: {
      type: Boolean,
      default: true,
    },
    checkInTime: {
      type: String,
      default: "09:00",
    },
    checkOutTime: {
      type: String,
      default: "18:00",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const GoalConfig = mongoose.model("GoalConfig", goalConfigSchema);

export default GoalConfig;
