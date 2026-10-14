import mongoose from 'mongoose';

const questionAnswerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    trim: true,
    default: ""
  },
  status: {
    type: String,
    enum: ['pending', 'answered', 'closed'],
    default: 'pending'
  },
  answeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  answeredAt: {
    type: Date
  }
}, { timestamps: true });

// Index for faster queries
questionAnswerSchema.index({ userId: 1, status: 1 });
questionAnswerSchema.index({ createdAt: -1 });

const QuestionAnswer = mongoose.model('QuestionAnswer', questionAnswerSchema);

export default QuestionAnswer;
