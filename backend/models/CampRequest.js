import mongoose from "mongoose";

const campRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userRole: {
      type: String,
      enum: ["employee", "cardHolder"],
      required: true,
    },
    requesterName: { type: String, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, trim: true },
    designation: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    submittedAt: { type: Date, default: Date.now },
    eligibleFrom: { type: Date },
    adminRemarks: { type: String, trim: true },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

campRequestSchema.index({ userId: 1 });
campRequestSchema.index({ status: 1 });
campRequestSchema.index({ submittedAt: -1 });

const CampRequest = mongoose.model("CampRequest", campRequestSchema);
export default CampRequest;
