import mongoose from "mongoose";

const pharmacyCategorySchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a pharmacy cannot have duplicate category names
pharmacyCategorySchema.index({ pharmacyId: 1, name: 1 }, { unique: true });

const PharmacyCategory = mongoose.model("PharmacyCategory", pharmacyCategorySchema);

export default PharmacyCategory;
