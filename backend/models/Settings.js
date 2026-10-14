import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    razorpay: {
      keyId: {
        type: String,
        default: "",
      },
      keySecret: {
        type: String,
        default: "",
      },
      isTestMode: {
        type: Boolean,
        default: true,
      },
      testKeyId: {
        type: String,
        default: "rzp_test_1DP5mmOlF5G5ag",
      },
      testKeySecret: {
        type: String,
        default: "",
      },
      webhookSecret: {
        type: String,
        default: "",
      },
      testWebhookSecret: {
        type: String,
        default: "",
      },
    },
    razorpayX: {
      keyId: {
        type: String,
        default: "",
      },
      keySecret: {
        type: String,
        default: "",
      },
      isTestMode: {
        type: Boolean,
        default: true,
      },
      testKeyId: {
        type: String,
        default: "",
      },
      testKeySecret: {
        type: String,
        default: "",
      },
      accountNumber: {
        type: String, // 10 digit RazorpayX account number
        default: "",
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    showSalaryBreakdown: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
