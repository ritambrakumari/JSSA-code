import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreatePaper",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    answers: {
      type: Map,
      of: Number, // questionId -> selectedOptionIndex
      default: {},
    },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    answeredCount: { type: Number, default: 0 },
    autoSubmitted: { type: Boolean, default: false },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    mouStatus: {
      type: String,
      enum: ["Pending", "Done", "Missed", "ConvertedEmployee"],
      default: "Pending",
    },
    notificationStatus: {
      type: String,
      enum: ["Pending", "Sent", "Failed"],
      default: "Pending",
    },
    lastNotifiedAt: { type: Date },
  },
  { timestamps: true },
);

// Prevent multiple attempts if not allowed by maxAttempts logic (checked in route)
attemptSchema.index({ testId: 1, userId: 1 });

const Attempt = mongoose.model("Attempt", attemptSchema);

export default Attempt;
