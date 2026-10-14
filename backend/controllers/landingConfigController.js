import LandingConfig from "../models/LandingConfig.js";

// @desc    Get landing page config
// @route   GET /api/landing-config
// @access  Public
export const getLandingConfig = async (req, res) => {
  try {
    const config = await LandingConfig.getConfig();
    res.status(200).json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Whatsapp Channel Link
// @route   GET /api/landing-config/whatsapp-channel
// @access  Public
export const getWhatsappChannel = async (req, res) => {
  try {
    const config = await LandingConfig.getConfig();
    res.status(200).json({ whatsappChannel: config.whatsappChannel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update landing page config
// @route   PUT /api/landing-config
// @access  Private/Admin
export const updateLandingConfig = async (req, res) => {
  try {
    const { contactUs, socialMedia, branches, floatingIcon, whatsappChannel } = req.body;
    let config = await LandingConfig.getConfig();

    if (contactUs) config.contactUs = contactUs;
    if (socialMedia) config.socialMedia = socialMedia;
    if (branches) config.branches = branches;
    if (floatingIcon) config.floatingIcon = floatingIcon;
    if (whatsappChannel !== undefined) config.whatsappChannel = whatsappChannel;

    const updatedConfig = await config.save();
    res.status(200).json(updatedConfig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
