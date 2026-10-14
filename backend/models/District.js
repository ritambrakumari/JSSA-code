import mongoose from "mongoose";

const DistrictSchema = new mongoose.Schema({
    state: { type: String, required: true },
    name: { type: String, required: true },
    nameHi: { type: String }
}, { timestamps: true });

// Prevent duplicate districts in the same state
DistrictSchema.index({ state: 1, name: 1 }, { unique: true });

const District = mongoose.model('District', DistrictSchema);
export default District;
