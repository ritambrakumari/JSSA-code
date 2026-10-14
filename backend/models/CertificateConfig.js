import mongoose from "mongoose";

const certificateConfigSchema = new mongoose.Schema(
  {
    globalExcellenceEnabled: {
      type: Boolean,
      default: true,
    },
    statePerformerEnabled: {
      type: Boolean,
      default: true,
    },
    targetAchievedEnabled: {
      type: Boolean,
      default: true,
    },
    partialPerformanceEnabled: {
      type: Boolean,
      default: true,
    },
    minCardsThresholdForPerformance: {
      type: Number,
      default: 50,
    },
    autoAssignCronEnabled: {
      type: Boolean,
      default: true,
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

const CertificateConfig = mongoose.model("CertificateConfig", certificateConfigSchema);

export default CertificateConfig;
