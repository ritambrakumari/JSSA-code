import mongoose from "mongoose";

const customCertificateSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true },
    position: { type: String, required: true },
    eventName: { type: String, required: true },
    location: { type: String, required: true },
    issueDate: { type: Date, required: true },
    submittedBy: { type: String, required: true },
    organizationName: { type: String, default: "जन स्वास्थ्य सहायता अभियान (JSSA)" },
    customContent: { type: String, default: "" },
    certNumber: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: true }
);

const CustomCertificate = mongoose.model("CustomCertificate", customCertificateSchema);

export default CustomCertificate;
