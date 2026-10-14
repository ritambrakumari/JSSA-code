import mongoose from "mongoose";

const pharmacyBillItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PharmacyProduct",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  total: {
    type: Number,
    required: true
  }
});

const pharmacyBillSchema = new mongoose.Schema({
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pharmacy",
    required: true
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prescription",
    default: null
  },
  customerMobile: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  isCardHolder: {
    type: Boolean,
    default: false
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card",
    default: null
  },
  items: [pharmacyBillItemSchema],
  subTotal: {
    type: Number,
    required: true
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["Generated", "Paid", "Cancelled"],
    default: "Generated"
  }
}, { timestamps: true });

export default mongoose.model("PharmacyBill", pharmacyBillSchema);
