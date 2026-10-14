import mongoose from "mongoose";

const claimSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card",
    required: true,
  },
  // --- New Form Fields ---
  cardHolderName: { type: String, required: true },
  relation: { type: String, required: true }, // S/O, D/O, W/O
  healthCardNumber: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String, required: true },
  aadhaarNumber: { type: String, required: true },
  panNumber: { type: String },
  bankDetails: {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    branch: { type: String, required: true }
  },
  address: { type: String, required: true },
  totalMedicalExpenses: { type: Number, required: true },
  
  // --- Financial Approval & Payout (Admin Only) ---
  approvedAmount: { type: Number, default: 0 },
  payoutStatus: { 
    type: String, 
    enum: ["pending", "processing", "paid", "failed"], 
    default: "pending" 
  },
  payoutId: { type: String }, // For Razorpay payout ID or Manual Txn
  payoutDate: { type: Date },
  paymentSlipUrl: { type: String }, // For manual payment proof

  // --- Multiple Documents ---
  documents: {
    healthCardCopy: { type: String, required: true },
    aadhaarFront: { type: String, required: true },
    aadhaarBack: { type: String, required: true },
    panFront: { type: String },
    claimForm: { type: String },
    bankPassbook: { type: String, required: true },
    doctorReport: { type: String, required: true },
    consultationFeeBill: { type: String, required: true },
    dischargeSummary: { type: String },
    hospitalBills: { type: String },
    diagnosticReports: { type: String },
    labBills: { type: String },
    pharmacyBills: { type: String },
    firCopy: { type: String },
    passportPhotos: [{ type: String, required: true }]
  },
  
  // Backward compatibility / Legacy (for old claims)
  title: { type: String },
  description: { type: String },
  evidence: { type: String }, 

  isDeleted: { type: Boolean, default: false },
  deletedReason: { type: String, default: "" },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  isRepeatedClaim: {
    type: Boolean,
    default: false
  },
  adminRemark: {
    type: String,
    default: "",
  },
  currentStage: {
    type: String,
    enum: ["PE", "BS", "DM", "ZC", "RM", "ADMIN", "COMPLETED"],
    default: "ADMIN"
  },
  stageDeadline: {
    type: Date
  },
  approvalHistory: [{
    role: { type: String, enum: ["PE", "BS", "DM", "ZC", "RM", "ADMIN", "CARDHOLDER"] },
    status: { type: String, enum: ["Approved", "Rejected", "approved", "rejected", "resubmitted", "bypassed_due_to_inactivity"] },
    remark: { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    date: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedReason: {
    type: String,
    default: ""
  }
});

claimSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Claim = mongoose.model("Claim", claimSchema);
export default Claim;
