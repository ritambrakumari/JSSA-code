import mongoose from "mongoose";

const pharmacyNotificationSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      // Optional: if null, it can be a global broadcast to all pharmacies, or you can require it for specific pharmacy mapping
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const PharmacyNotification = mongoose.model(
  "PharmacyNotification",
  pharmacyNotificationSchema
);

export default PharmacyNotification;
