import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD for easy daily querying
      required: true,
    },
    checkIn: {
      time: Date,
      location: {
        lat: Number,
        lng: Number,
        address: String,
      },
      selfie: String,
    },
    checkOut: {
      time: Date,
      location: {
        lat: Number,
        lng: Number,
        address: String,
      },
    },
    status: {
      type: String,
      enum: ["Present", "Half-Day", "Absent", "Late", "Early Out", "Late & Early Out", "Checked-In", "Completed"],
      default: "Present",
    },
    workingHours: {
      type: Number, // In hours
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
