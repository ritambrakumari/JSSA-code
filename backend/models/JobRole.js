import mongoose from "mongoose";

const jobRoleSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    termsConditions: {
      type: String,
      default: "Accepted",
    },
    permissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const JobRole = mongoose.model("JobRole", jobRoleSchema);

export default JobRole;
