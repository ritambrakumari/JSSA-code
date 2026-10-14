import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    tokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorToken",
      required: true,
    },
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
    medicines: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PharmacyProduct",
        },
        name: {
          type: String,
          required: true,
        },
        dosage: {
          type: String,
          required: true,
        },
        frequency: {
          type: String,
          default: "",
        },
        duration: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          default: "Tablet",
        },
        instructions: {
          type: String,
          default: "",
        },
        source: {
          type: String,
          enum: ["in_house", "outside"],
          default: "in_house",
        },
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending_pharmacy", "dispensed"],
      default: "pending_pharmacy",
    },
    billGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
