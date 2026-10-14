import mongoose from "mongoose";

const pharmacySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Admin will enter name (can be owner name or shop name)
    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    // --- SECTION A: General / Employee-like Details ---
    fatherName: { type: String, trim: true },
    dob: { type: Date },
    motherName: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    aadharNumber: { type: String, trim: true },
    nationality: { type: String, default: "indian" },
    maritalStatus: { type: String, default: "Unmarried" },
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

    // General Document URLs
    aadharFront: { type: String },
    aadharBack: { type: String },
    panCard: { type: String },
    bankDoc: { type: String },
    photo: { type: String },
    signature: { type: String },

    // --- SECTION B: Pharmacy Specific Details ---
    shopName: { type: String, trim: true },
    gstinNumber: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    pharmacyLicenseNumber: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    licenseValidityDate: { type: Date },
    pharmacistName: { type: String, trim: true },
    pharmacistRegistrationNumber: { type: String, trim: true },
    pharmacistRegNumber: { type: String, trim: true },
    shopAddress: { type: String, trim: true },
    fullAddress: { type: String, trim: true },
    operatingHours: { type: String, trim: true },
    is24x7: { type: Boolean, default: false },
    
    // Pharmacy Document URLs
    licenseCopy: { type: String },
    licenseDoc: { type: String },
    shopPhoto: { type: String },
    gstCertificate: { type: String },
    ownerIdProof: { type: String },

    // System Details
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Terminated"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    strictPopulate: false
  }
);

const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);

export default Pharmacy;
