import mongoose from 'mongoose';

const trainingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    embedLink: {
        type: String,
        required: true
    },
    postType: {
        type: String,
        enum: ['District Manager', 'Block Supervisor', 'Panchayat Executive'],
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'uploadedByModel'
    },
    uploadedByModel: {
        type: String,
        required: true,
        enum: ['User', 'AdministrativeStaff']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Training', trainingSchema);
