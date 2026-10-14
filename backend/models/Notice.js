import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    noticeEnglish: {
      type: String,
      default: "",
      trim: true,
    },
    noticeHindi: {
      type: String,
      default: "",
      trim: true,
    },
    importantNotice: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for sorting
noticeSchema.index({ isActive: 1, createdAt: -1 });

const Notice = mongoose.model("Notice", noticeSchema);

export default Notice;
