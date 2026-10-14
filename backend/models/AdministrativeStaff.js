import mongoose from "mongoose";

const administrativeStaffSchema = new mongoose.Schema(
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
      trim: true,
    },
    dob: {
      type: Date,
    },
    jobRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobRole",
      required: true,
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
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    accountStatus: {
      type: String,
      enum: ["Active", "Inactive", "Terminated"],
      default: "Active",
    },
    salaryStructure: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      conveyanceAllowance: { type: Number, default: 0 },
      statutoryBonus: { type: Number, default: 0 },
      mobileBill: { type: Number, default: 0 },
      performanceBonus: { type: Number, default: 0 },
      grossSalary: { type: Number, default: 0 },
      benefits: {
        pf: { type: Number, default: 0 },
        gratuity: { type: Number, default: 0 },
        insurance: { type: Number, default: 0 },
      },
      ctc: { type: Number, default: 0 },
    },
    cardCommission: {
      enabled: { type: Boolean, default: false },
      amountPerCard: { type: Number, default: 0 }
    },
    salaryWallet: { type: Number, default: 0 },
    totalCardEarnings: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const AdministrativeStaff = mongoose.model("AdministrativeStaff", administrativeStaffSchema);

export default AdministrativeStaff;
