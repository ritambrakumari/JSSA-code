import mongoose from "mongoose";

const broadcastJobSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreatePaper",
    },
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
    },
    jobType: {
      type: String,
      enum: ["test", "mou", "meeting", "meeting_reminder", "doctor_consult"],
      default: "test",
    },
    title: {
      type: String,
      required: true,
    },
    totalCandidates: {
      type: Number,
      required: true,
    },
    candidateIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application"
    }],
    sentCount: {
      type: Number,
      default: 0,
    },
    emailSentCount: {
      type: Number,
      default: 0,
    },
    smsSentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "paused", "completed", "failed", "cancelled"],
      default: "pending",
    },
    channels: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index to find active jobs for a user or test
broadcastJobSchema.index({ createdBy: 1, status: 1 });
broadcastJobSchema.index({ testId: 1, status: 1 });

const BroadcastJob = mongoose.model("BroadcastJob", broadcastJobSchema);

export default BroadcastJob;
