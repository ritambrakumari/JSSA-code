import mongoose from "mongoose";

const letterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    block: {
      type: String,
      trim: true,
    },
    blockName: {
      type: String,
      trim: true,
    },
    panchayat: {
      type: String,
      trim: true,
    },
    panchayatName: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "image"],
      default: "pdf",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    letterLevel: {
      type: String,
      enum: ["State", "District", "Block", "Panchayat", "Employee"],
      default: "Panchayat",
    },
    isEmployeeUpload: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Letter = mongoose.model("Letter", letterSchema);
export default Letter;
