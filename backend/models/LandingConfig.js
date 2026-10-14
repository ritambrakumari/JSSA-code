import mongoose from "mongoose";

const landingConfigSchema = new mongoose.Schema(
  {
    contactUs: {
      phones: [{ type: String }],
      emails: [{ type: String }],
    },
    socialMedia: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      x: { type: String, default: "" },
    },
    branches: [
      {
        name: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String },
        email: { type: String },
        showInFooter: { type: Boolean, default: false },
      },
    ],
    floatingIcon: {
      phone: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
    },
    whatsappChannel: { type: String, default: "" },
  },
  { timestamps: true }
);

// Ensure only one document exists
landingConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      contactUs: { phones: [], emails: [] },
      socialMedia: { facebook: "", instagram: "", youtube: "", linkedin: "", x: "" },
      branches: [],
      floatingIcon: { phone: "", whatsapp: "" },
      whatsappChannel: "",
    });
  }
  return config;
};

const LandingConfig = mongoose.model("LandingConfig", landingConfigSchema);

export default LandingConfig;
