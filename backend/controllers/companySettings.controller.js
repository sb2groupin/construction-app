const CompanySettings = require("../models/CompanySettings");
const { sendSuccess, sendError } = require("../utils/response.utils");

const getSettings = async (req, res, next) => {
  try {
    const settings = await CompanySettings.getSettings();
    return sendSuccess(res, { settings });
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const allowed = [
      "companyName","address","phone","email","gstNumber",
      "overtimeThresholdHours","overtimeRateMultiplier","halfDayCutoffHours",
      "defaultGeoFenceRadius","sickLeavePerYear","casualLeavePerYear","earnedLeavePerYear",
      "otpMethod","pdfFooterText",
    ];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Logo upload (Cloudinary URL from body)
    if (req.body.logo) updates.logo = req.body.logo;

    let settings = await CompanySettings.findOne();
    if (!settings) settings = new CompanySettings();
    Object.assign(settings, updates);
    await settings.save();
    return sendSuccess(res, { settings }, "Settings updated ✅");
  } catch (err) { next(err); }
};

module.exports = { getSettings, updateSettings };
