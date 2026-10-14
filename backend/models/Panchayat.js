import mongoose from "mongoose";

const PanchayatSchema = new mongoose.Schema({
    state: { type: String, required: true },
    district: { type: String, required: true },
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
    name: { type: String, required: true },
    nameHi: { type: String }
}, { timestamps: true });

// Prevent duplicate panchayats in the same block
PanchayatSchema.index({ block: 1, name: 1 }, { unique: true });

const Panchayat = mongoose.model('Panchayat', PanchayatSchema);
export default Panchayat;
