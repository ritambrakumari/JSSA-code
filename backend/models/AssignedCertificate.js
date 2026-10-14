import mongoose from "mongoose";

const assignedCertificateSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    templateId: {
      type: String, // e.g. 'rm-zc-dm-cert-1'
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The admin user (optional for system auto-cron)
      required: false,
    },
    assignmentType: {
      type: String,
      enum: ["manual", "auto_global", "auto_state", "auto_target", "auto_performance"],
      default: "manual",
    },
    month: {
      type: Number,
    },
    year: {
      type: Number,
    },
    cardsCount: {
      type: Number,
      default: 0,
    },
    targetCount: {
      type: Number,
      default: 0,
    },
    achievementPercentage: {
      type: Number,
      default: 0,
    },
    state: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const AssignedCertificate = mongoose.model("AssignedCertificate", assignedCertificateSchema);

export default AssignedCertificate;
