import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    altPhone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },
    address: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Follow Up", "Qualified", "Disqualified"],
      default: "Pending",
    },
    callRemark: {
      type: String,
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    notes: String,
    history: [
      {
        status: String,
        remark: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        date: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
