import mongoose from "mongoose";

const feedSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  images: [{
    type: String
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  adminRemarks: {
    type: String,
  },
  processedAt: {
    type: Date,
  }
}, { timestamps: true });

const Feed = mongoose.model("Feed", feedSchema);
export default Feed;
