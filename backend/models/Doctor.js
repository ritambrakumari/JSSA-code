import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    personalMobile: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    descriptionHi: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    bioHi: {
      type: String,
      default: '',
    },
    specification: [{
      type: String,
      trim: true
    }],
    specificationHi: [{
      type: String,
      trim: true
    }],
    availabilityDate: {
      startDate: { type: Date },
      endDate: { type: Date }
    },
    availabilityTime: {
      startTime: { type: String, default: "" },
      endTime: { type: String, default: "" }
    },
    clinicName: {
      type: String,
      trim: true,
      default: '',
    },
    clinicAddress: {
      type: String,
      default: '',
    },
    contactNumbers: [
      {
        type: String,
        validate: {
          validator: function(v) {
            return /^\d{10}$/.test(v);
          },
          message: props => `${props.value} is not a valid 10-digit mobile number!`
        }
      }
    ],
    assignedTo: {
      cardholder: {
        type: Boolean,
        default: false,
      },
      employee: {
        type: Boolean,
        default: false,
      },
    },
    youtubeLink: {
      type: String,
      default: '',
    },
    gmeetLink: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'active', 'inactive'],
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    // Onboarding fields
    fatherName: { type: String, trim: true },
    gender: { type: String, default: "Male" },
    medicalRegNo: { type: String, trim: true },
    experience: [{
      orgName: { type: String, trim: true },
      detail: { type: String, trim: true },
      startDate: { type: Date },
      endDate: { type: Date },
      totalExperience: { type: String, trim: true },
      docUrl: { type: String }
    }],
    qualifications: [{
      degreeName: { type: String, trim: true },
      universityName: { type: String, trim: true },
      passingYear: { type: String, trim: true },
      pr: { type: String, trim: true },
      docUrl: { type: String }
    }],
    aadharNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    
    // Bank Details
    accountHolderName: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    
    // Documents
    aadharFront: { type: String },
    aadharBack: { type: String },
    panCardDoc: { type: String },
    medicalDegreeDoc: { type: String },
    medicalRegDoc: { type: String },
    bankPassbookDoc: { type: String },
    signatureDoc: { type: String },
    sessionHistory: [
      {
        startTime: { type: Date, default: Date.now },
        endTime: { type: Date, default: null },
        youtubeLink: { type: String, default: '' },
        gmeetLink: { type: String, default: '' },
        assignedTo: {
          cardholder: { type: Boolean, default: false },
          employee: { type: Boolean, default: false },
        },
      }
    ],
  },
  { timestamps: true }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
