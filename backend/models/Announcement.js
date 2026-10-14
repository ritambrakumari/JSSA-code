import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Announcement message is required"],
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Expired"],
      default: "Draft",
    },
    expiryDate: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    targetRole: {
      type: String,
      default: "employee",
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

// Update publishedAt when status changes to Published
announcementSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "Published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
