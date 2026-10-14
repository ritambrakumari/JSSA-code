import mongoose from "mongoose";

const supportContactSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contacts: [
      {
        mobile: {
          type: String,
          required: true,
          trim: true,
        },
        timing: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SupportContact = mongoose.model("SupportContact", supportContactSchema);

export default SupportContact;
