import mongoose from "mongoose";

const campSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    blockId: { type: mongoose.Schema.Types.ObjectId, ref: "Block" },
    panchayatId: { type: mongoose.Schema.Types.ObjectId, ref: "Panchayat" },
    blockName: { type: String, trim: true },
    panchayatName: { type: String, trim: true },
    campDate: { type: Date },
    organizer: { type: String, trim: true },
    address: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

campSchema.index({ status: 1 });
campSchema.index({ state: 1, district: 1 });

const Camp = mongoose.model("Camp", campSchema);
export default Camp;
