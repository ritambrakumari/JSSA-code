import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ifscCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    branchName: {
      type: String,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Ensure only one primary account per employee
bankAccountSchema.pre("save", async function (next) {
  if (this.isPrimary) {
    await mongoose.models.BankAccount.updateMany(
      { employeeId: this.employeeId, _id: { $ne: this._id } },
      { isPrimary: false }
    );
  }
  next();
});

const BankAccount = mongoose.model("BankAccount", bankAccountSchema);

export default BankAccount;
