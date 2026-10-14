import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  type: {
    type: String,
    enum: ['instant', 'scheduled'],
    default: 'instant'
  },
  platform: {
    type: String,
    enum: ['internal', 'gmeet', 'youtube'],
    default: 'internal'
  },
  externalUrl: {
    type: String,
    default: null
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  scheduledFor: {
    type: Date
  },
  invitedParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  activeParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  meetingPoints: [{
    text: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  observations: {
    type: String,
    default: ""
  },
  attachments: [{
    name: String,
    url: String,
    fileType: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  settings: {
    micEnabled: { type: Boolean, default: true },
    cameraEnabled: { type: Boolean, default: true },
    screenShareEnabled: { type: Boolean, default: true },
    chatEnabled: { type: Boolean, default: true }
  },
  duration: {
    type: Number, // in minutes, 0 means unlimited/manual
    default: 0
  },
  recordingStatus: {
    type: String,
    enum: ['pending', 'started', 'completed', 'failed'],
    default: 'pending'
  },
  recordingUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
