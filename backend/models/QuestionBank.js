import mongoose from "mongoose";

const questionBankSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
    },
    questionHi: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      default: "General",
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: [true, "Difficulty is required"],
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: "At least 2 options are required",
      },
    },
    optionsHi: {
      type: [String],
      default: [],
    },
    correctAnswer: {
      type: String,
      required: [true, "Correct answer is required"],
      trim: true,
    },
    explanation: {
      type: String,
      default: "",
      trim: true,
    },
    explanationHi: {
      type: String,
      default: "",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "draft"],
      default: "draft",
    },
    usedInPapers: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

questionBankSchema.index({ createdAt: -1 });
questionBankSchema.index({ status: 1, difficulty: 1 });

const QuestionBank = mongoose.model("QuestionBank", questionBankSchema);

export default QuestionBank;
