import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["Active", "Archived"],
      default: "Active"
    }
  },
  {
    timestamps: true
  }
);

// Prevent multiple reviews for the same superior in a short time (e.g. 30 days)
reviewSchema.index({ reviewerId: 1, targetId: 1, createdAt: 1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
