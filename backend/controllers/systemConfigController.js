import SystemConfig from "../models/SystemConfig.js";

export const systemConfigController = {
  getConfig: async (req, res) => {
    try {
      let config = await SystemConfig.findOne();
      if (!config) {
        config = await SystemConfig.create({
          cardPrice: 150,
          commissions: { PE: 50, BS: 100, DM: 150 }
        });
      }
      res.json({ success: true, data: config });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updateConfig: async (req, res) => {
    try {
      const { cardPrice, commissions, isWithdrawalEnabled, referralBonusAmount, pharmacyDiscountPercent } = req.body;
      let config = await SystemConfig.findOne();
      
      if (!config) {
        config = new SystemConfig({ cardPrice, commissions, isWithdrawalEnabled, referralBonusAmount, pharmacyDiscountPercent, updatedBy: req.user.id });
      } else {
        if (cardPrice !== undefined) config.cardPrice = cardPrice;
        if (commissions !== undefined) config.commissions = commissions;
        if (isWithdrawalEnabled !== undefined) config.isWithdrawalEnabled = isWithdrawalEnabled;
        if (referralBonusAmount !== undefined) config.referralBonusAmount = referralBonusAmount;
        if (pharmacyDiscountPercent !== undefined) config.pharmacyDiscountPercent = pharmacyDiscountPercent;
        config.updatedBy = req.user.id;
      }
      
      await config.save();
      res.json({ success: true, message: "Configuration updated successfully", data: config });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
