import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    candidateName: {
      type: String,
      required: [true, "Candidate name is required"],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: "Mobile must be exactly 10 digits",
      },
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },
    higherEducation: {
      type: String,
      required: [true, "Higher education is required"],
      trim: true,
    },
    photo: {
      type: String, // URL or base64
      default: null,
    },
    signature: {
      type: String, // URL or base64
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobPostingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: null,
    },
    category: {
      type: String,
      enum: ["general", "obc", "sc", "st", "ews"],
      default: null,
    },
    // Additional personal details
    motherName: {
      type: String,
      default: null,
      trim: true,
    },
    dob: {
      type: Date,
      default: null,
    },
    nationality: {
      type: String,
      enum: ["indian", "other"],
      default: null,
    },
    aadhar: {
      type: String,
      default: null,
      trim: true,
    },
    pan: {
      type: String,
      default: null,
      trim: true,
    },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    state: {
      type: String,
      default: null,
      trim: true,
    },
    block: {
      type: String,
      default: null,
      trim: true,
    },
    panchayat: {
      type: String,
      default: null,
      trim: true,
    },
    pincode: {
      type: String,
      default: null,
      trim: true,
    },
    // Education details
    board: {
      type: String,
      default: null,
      trim: true,
    },
    marks: {
      type: String,
      default: null,
      trim: true,
    },
    markPercentage: {
      type: String,
      default: null,
      trim: true,
    },
    applicationNumber: {
      type: String,
      default: null,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "refund processing"],
      default: "pending",
    },
    paymentId: {
      type: String,
      default: null,
    },
    orderId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    // MOU Related Fields
    wardNo: { type: String, default: null },
    postOffice: { type: String, default: null },
    policeStation: { type: String, default: null },
    country: { type: String, default: "India" },
    handicapDisability: { type: String, default: "No" },
    maritalStatus: { type: String, default: "Unmarried" },
    languageKnown: { type: String, default: null },
    bloodGroup: { type: String, default: null },
    // Bank Details
    accountHolderName: { type: String, default: null },
    bankName: { type: String, default: null },
    accountNumber: { type: String, default: null },
    ifscCode: { type: String, default: null },
    branchName: { type: String, default: null },
    // Nominee Details
    nomineeName: { type: String, default: null },
    nomineeRelation: { type: String, default: null },
    nomineeAge: { type: String, default: null },
    nomineeAadhar: { type: String, default: null },
    nomineeMobile: { type: String, default: null },
    nomineeEmail: { type: String, default: null },
    // Education Details (Multiple)
    educationDetails: [{
      level: String,
      board: String,
      year: String,
      percentage: String,
      file: String
    }],
    // Official IDs
    employeeId: { type: String, default: null },
    // MOU Status
    mouStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    mouPaymentId: { type: String, default: null },
    mouPaidAt: { type: Date, default: null },
    mouOrderId: { type: String, default: null },
    mouAmount: { type: Number, default: 0 },

    // MOU Document Uploads
    aadharFront: { type: String, default: null },
    aadharBack: { type: String, default: null },
    panCard: { type: String, default: null },
    bankDoc: { type: String, default: null }, // Cancelled Cheque or Passbook

    // Referral System
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
applicationSchema.index({ candidateName: "text", mobile: "text", district: "text" });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ createdBy: 1 });
applicationSchema.index({ jobPostingId: 1 });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
