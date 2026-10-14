import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    jobPostingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      required: false,
    },
    motherName: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    aadharNumber: { type: String, trim: true },
    nationality: { type: String, default: "indian" },
    maritalStatus: { type: String, default: "Unmarried" },
    handicapDisability: { type: String, default: "No" },
    language: { type: String, default: "Hindi, English" },

    // Address Details
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    blockKhand: { type: String, trim: true },
    gramPanchayat: { type: String, trim: true },
    villageTola: { type: String, trim: true },
    wardNo: { type: String, trim: true },
    post: { type: String, trim: true },
    policeStation: { type: String, trim: true },
    pincode: { type: String, trim: true },

    // Education
    educationDetails: [
      {
        level: String,
        board: String,
        year: String,
        percentage: String,
        file: String, // URL
      },
    ],

    // Bank Details
    accountHolderName: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    branchName: { type: String, trim: true },

    // Nominee Details
    nomineeName: { type: String, trim: true },
    nomineeRelation: { type: String, trim: true },
    nomineeAge: { type: String, trim: true },
    nomineeAadhar: { type: String, trim: true },
    nomineeMobile: { type: String, trim: true },
    nomineeEmail: { type: String, trim: true },

    // Document URLs
    aadharFront: { type: String },
    aadharBack: { type: String },
    panCard: { type: String },
    bankDoc: { type: String },
    photo: { type: String },
    signature: { type: String },

    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Terminated", "Resigned"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Working Zone Details (Team Management)
    workingState: { type: String, trim: true },
    workingDistrict: { type: String, trim: true },
    workingBlock: { type: mongoose.Schema.Types.ObjectId, ref: "Block" },
    workingBlocks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Block" }],
    workingPanchayat: { type: mongoose.Schema.Types.ObjectId, ref: "Panchayat" },
    workingPanchayats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Panchayat" }],
    isAllBlocksAssigned: { type: Boolean, default: false },
    isAllPanchayatsAssigned: { type: Boolean, default: false },
    isZoneLocked: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0, min: 0 },
    salaryWallet: { type: Number, default: 0, min: 0 },
    role: { type: String, trim: true }, // Short role like DM, BS, PE
    designation: { type: String, trim: true }, // Full title
    reportingTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Immediate Upper Manager
  },
  {
    timestamps: true,
    strictPopulate: false
  }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
