import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
    },
    motherName: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Gender is required"],
    },
    aadharNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^\d{12}$/.test(v);
        },
        message: "Aadhar must be exactly 12 digits",
      },
    },
    address: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^\d{6}$/.test(v);
        },
        message: "Pincode must be exactly 6 digits",
      },
    },
    education: {
      type: String,
      trim: true,
    },
    course: {
      type: String,
      trim: true,
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    photo: {
      type: String, // URL or base64
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// userId index removed - already has unique: true which creates an index
studentSchema.index({ fullName: "text", enrollmentNumber: "text" });
studentSchema.index({ status: 1 });

const Student = mongoose.model("Student", studentSchema);

export default Student;
