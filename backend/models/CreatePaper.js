import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    icon: { type: String, default: "Trophy", trim: true },
    label: { type: String, required: true, trim: true },
    points: { type: Number, required: true, min: 0 },
    threshold: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);

const questionConfigSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionBank",
      required: true,
    },
    marks: { type: Number, default: 1, min: 0 },
    isCompulsory: { type: Boolean, default: false },
  },
  { _id: false },
);

const createPaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    class: { type: String, default: "", trim: true },
    type: { type: String, default: "", trim: true },
    difficulty: { type: String, default: "Mixed", trim: true },
    questionConfigs: { type: [questionConfigSchema], default: [] },
    duration: { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, default: 0, min: 0 },
    description: { type: String, default: "", trim: true },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    isPublic: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: false },
    showResult: { type: Boolean, default: true },
    resultDate: { type: String, default: "" }, // New field for scheduled result
    mouStartDate: { type: String, default: "" },
    mouEndDate: { type: String, default: "" },
    maxAttempts: { type: Number, default: 1, min: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    totalMarks: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["published", "draft"], default: "draft" },
    attempts: { type: Number, default: 0, min: 0 },
    avgScore: { type: Number, default: 0, min: 0, max: 100 },
    rewards: { type: [rewardSchema], default: [] },
    assignedStudents: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Application",
      default: [],
    },
    createdDate: { type: Date, default: Date.now },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentExamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreatePaper",
      default: null,
    },
    rescheduleTarget: {
      type: String,
      enum: ["Fail", "Missed", "Pass", "Not Started", "Mixed", null],
      default: null,
    },
  },
  { timestamps: true },
);

createPaperSchema.index({ createdAt: -1 });
createPaperSchema.index({ status: 1, createdAt: -1 });
createPaperSchema.index({ assignedStudents: 1 });

const CreatePaper = mongoose.model("CreatePaper", createPaperSchema);

export default CreatePaper;
