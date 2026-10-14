import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allows multiple null values
      // index: true removed - using explicit index below to avoid duplicate
      validate: {
        validator: function (v) {
          // Email is optional, but if provided, must be valid
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email format",
      },
    },
    phone: {
      type: String,
      trim: true,
      sparse: true, // Allows multiple null values
      // index: true removed - using explicit index below to avoid duplicate
      validate: {
        validator: function (v) {
          // Phone is optional, but if provided, must be 10 digits
          return !v || /^\d{10}$/.test(v);
        },
        message: "Phone must be exactly 10 digits",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "applicant", "employee", "cardHolder", "superadmin", "staff", "pharmacy", "doctor"],
      default: "applicant",
      required: true,
    },
    isPasswordSet: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    restrictionType: {
      type: String,
      enum: ["ip", "geolocation", "anywhere"],
      default: "anywhere",
    },
    allowedIPs: {
      type: [String],
      default: [],
    },
    allowedLocations: [
      {
        lat: Number,
        lng: Number,
        radius: { type: Number, default: 500 }, // default 500 meters
        name: String,
      },
    ],
    minTokenIssuedAt: {
      type: Date,
      default: null,
    },
    name: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictPopulate: false
  }
);

// Virtual for employee record associated with this user
userSchema.virtual("employeeId", {
  ref: "Employee",
  localField: "_id",
  foreignField: "userId",
  justOne: true
});

// Index for email uniqueness (when not null) - sparse index allows multiple nulls
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// Index for phone uniqueness (when not null) - sparse index allows multiple nulls
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

// Pre-save validation: ensure at least email or phone is provided
userSchema.pre("save", function (next) {
  if (!this.email && !this.phone) {
    const error = new Error("Either email or phone number is required");
    error.name = "ValidationError";
    return next(error);
  }
  next();
});

// Generate and set OTP
userSchema.methods.generateOTP = function () {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
  this.otp = otpCode;
  this.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  return otpCode;
};

// Verify OTP
userSchema.methods.verifyOTP = function (enteredOtp) {
  if (!this.otp || !this.otpExpiry) return false;
  if (this.otp !== enteredOtp) return false;
  if (Date.now() > this.otpExpiry) return false;
  
  // Clear OTP after successful verification
  this.otp = null;
  this.otpExpiry = null;
  return true;
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model("User", userSchema);

export default User;
