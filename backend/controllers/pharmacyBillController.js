import PharmacyBill from "../models/PharmacyBill.js";
import Card from "../models/Card.js";
import Pharmacy from "../models/Pharmacy.js";
import SystemConfig from "../models/SystemConfig.js";
import PharmacyProduct from "../models/PharmacyProduct.js";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";

export const pharmacyBillController = {
  createBill: async (req, res) => {
    try {
      const { prescriptionId, customerMobile, customerName, isCardHolder, cardId, items, subTotal, discountPercent, discountAmount, finalAmount } = req.body;
      
      const pharmacy = await Pharmacy.findOne({ userId: req.user.id });
      if (!pharmacy) {
        return res.status(404).json({ success: false, error: "Pharmacy not found" });
      }

      // VALIDATE AND DEDUCT STOCK
      const bulkOperations = [];
      for (const item of items) {
        const product = await PharmacyProduct.findById(item.product);
        if (!product) {
          return res.status(404).json({ success: false, error: `Product not found: ${item.name}` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({ success: false, error: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
        }
        
        const newStock = product.stock - item.quantity;
        const newStatus = newStock === 0 ? "Out of Stock" : product.status;
        
        bulkOperations.push({
          updateOne: {
            filter: { _id: product._id },
            update: { 
              $inc: { stock: -item.quantity, soldQuantity: item.quantity },
              $set: { status: newStatus }
            }
          }
        });
      }

      // Execute bulk update
      if (bulkOperations.length > 0) {
        await PharmacyProduct.bulkWrite(bulkOperations);
      }

      const bill = new PharmacyBill({
        pharmacyId: pharmacy._id,
        customerMobile,
        customerName,
        isCardHolder,
        cardId,
        items,
        subTotal,
        discountPercent,
        discountAmount,
        finalAmount,
        status: "Generated",
        prescriptionId: prescriptionId || null
      });

      await bill.save();

      if (prescriptionId) {
        await Prescription.findByIdAndUpdate(prescriptionId, { billGenerated: true });
      }

      res.status(201).json({ success: true, bill });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getBills: async (req, res) => {
    try {
      const pharmacy = await Pharmacy.findOne({ userId: req.user.id });
      if (!pharmacy) {
        return res.status(404).json({ success: false, error: "Pharmacy not found" });
      }

      const { page, limit, search } = req.query;
      
      let filter = { pharmacyId: pharmacy._id };
      
      if (search) {
        filter.$or = [
          { customerName: { $regex: search, $options: "i" } },
          { customerMobile: { $regex: search, $options: "i" } }
        ];
      }

      const query = PharmacyBill.find(filter).sort({ createdAt: -1 });
      const totalBills = await PharmacyBill.countDocuments(filter);

      let bills;
      if (page && limit) {
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;
        const skip = (pageNumber - 1) * limitNumber;
        bills = await query.skip(skip).limit(limitNumber);
        
        res.json({
          success: true,
          bills,
          totalBills,
          totalPages: Math.ceil(totalBills / limitNumber),
          currentPage: pageNumber
        });
      } else {
        bills = await query;
        res.json({ success: true, bills, totalBills, totalPages: 1, currentPage: 1 });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  verifyCardholder: async (req, res) => {
    try {
      const { mobile } = req.params;
      
      // OPTIMIZATION: Added .select() to only fetch required fields, and .lean() to bypass heavy mongoose document instantiation
      const card = await Card.findOne({ mobileNumber: mobile })
                             .select("cardholderName _id")
                             .lean();
      
      if (card) {
        // OPTIMIZATION: Added .select() and .lean() to config fetch as well
        let config = await SystemConfig.findOne().select("pharmacyDiscountPercent").lean();
        const discountPercent = config ? config.pharmacyDiscountPercent : 10;
        
        res.json({ 
          success: true, 
          isCardHolder: true, 
          cardholderData: {
            name: card.cardholderName,
            cardId: card._id,
            discountPercent
          } 
        });
      } else {
        res.json({ success: true, isCardHolder: false });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getBillByPrescription: async (req, res) => {
    try {
      const { prescriptionId } = req.params;
      const bill = await PharmacyBill.findOne({ prescriptionId }).populate("pharmacyId", "name shopName shopAddress userId");
      
      if (!bill) {
        return res.status(404).json({ success: false, error: "Bill not found" });
      }

      // We need to fetch pharmacy details if the user needs email/phone
      const pharmacyUser = bill.pharmacyId && bill.pharmacyId.userId ? 
        await User.findById(bill.pharmacyId.userId).select('email phone') : null;
        
      res.json({ success: true, bill, pharmacyUser });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
