import mongoose from "mongoose";

const BlockSchema = new mongoose.Schema({
    state: { type: String, required: true },
    district: { type: String, required: true },
    name: { type: String, required: true },
    nameHi: { type: String }
}, { timestamps: true });

// Prevent duplicate blocks in the same state/district
BlockSchema.index({ state: 1, district: 1, name: 1 }, { unique: true });

const Block = mongoose.model('Block', BlockSchema);
export default Block;
