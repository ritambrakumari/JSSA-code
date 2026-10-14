import mongoose from "mongoose";

const doctorTokenSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    cardholderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
    },
    tokenNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "prescribed", "dispensed", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const DoctorToken = mongoose.model("DoctorToken", doctorTokenSchema);

export default DoctorToken;
