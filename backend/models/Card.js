import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  // Section 1: Basic Info
  cardType: { type: String, enum: ["New Card", "Old Card"], required: true, default: "New Card" },
  cardholderName: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  dob: { type: Date, required: true },
  age: { type: Number },
  photo: { type: String }, // URL or Base64
  aadhaarNumber: { type: String, required: true, unique: true },
  panNumber: { type: String },

  // Section 2: Contact
  mobileNumber: { type: String, required: true },
  email: { type: String },
  addressLine: { type: String, required: true }, // House, Street, Area
  villageCity: { type: String, required: true },
  block: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String },

  // Section 3: Family & Social (The Logic)
  maritalStatus: { 
    type: String, 
    enum: ["Unmarried", "Married", "Widowed", "Divorced", "Separated", "Other"],
    required: true 
  },
  fatherOrHusbandName: { type: String, required: true },
  fatherOrHusbandMobile: { type: String },
  motherName: { type: String, required: true },
  spouseName: { type: String },
  numberOfChildren: { type: Number, default: 0 },

  // Section 4: Professional & Health
  occupation: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  isHandicapped: { type: Boolean, default: false },
  disabilityType: { type: String },
  disabilityPercentage: { type: Number },
  languages: [{ type: String }],
  preExistingDisease: { type: String },

  // Section 5: Nominee & Financial
  nomineeName: { type: String, required: true },
  nomineeRelation: { type: String, required: true },
  bankName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  branchName: { type: String },

  // System Fields
  cardId: { type: String, unique: true }, // Unique Generated ID (e.g., JSSA-CARD-XXXX)
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Employee ID
  cardHolderUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Linked CardHolder Login
  location: {
    lat: Number,
    lng: Number
  },
  status: { type: String, enum: ["Active", "Inactive", "Pending"], default: "Active" },
  cardCreatedDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update 'updatedAt' field
cardSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add Indexes for Performance Optimization
cardSchema.index({ createdAt: -1 });
cardSchema.index({ cardType: 1, createdAt: -1 });
cardSchema.index({ issuedBy: 1, createdAt: -1 });
cardSchema.index({ state: 1 });
cardSchema.index({ district: 1 });
cardSchema.index({ block: 1 });
cardSchema.index({ villageCity: 1 });
cardSchema.index({ mobileNumber: 1 });

const Card = mongoose.model("Card", cardSchema);
export default Card;
