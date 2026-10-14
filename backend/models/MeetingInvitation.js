import mongoose from 'mongoose';

const meetingInvitationSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'ignored'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for performance
meetingInvitationSchema.index({ recipientId: 1, status: 1 });
meetingInvitationSchema.index({ meetingId: 1 });

const MeetingInvitation = mongoose.model('MeetingInvitation', meetingInvitationSchema);

export default MeetingInvitation;
