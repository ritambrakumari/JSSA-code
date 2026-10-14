import mongoose from "mongoose";

const resignationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Withdrawn"],
      default: "Pending",
    },
    eligibilityBaseDate: { type: Date, required: true },
    eligibleFrom: { type: Date, required: true },
    mouPaidAt: { type: Date, default: null },
    submittedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    adminRemarks: { type: String, default: "" },
  },
  { timestamps: true }
);

resignationSchema.index({ userId: 1 });
resignationSchema.index({ employeeId: 1 });
resignationSchema.index({ status: 1 });

const Resignation = mongoose.model("Resignation", resignationSchema);
export default Resignation;
