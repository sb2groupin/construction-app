const mongoose = require("mongoose");

const companySettingsSchema = new mongoose.Schema(
  {
    companyName:        { type: String, default: "My Construction Company" },
    logo:               { type: String, default: null },        // Cloudinary URL
    address:            { type: String, default: null },
    phone:              { type: String, default: null },
    email:              { type: String, default: null },
    gstNumber:          { type: String, default: null },
    // Payroll settings
    overtimeThresholdHours: { type: Number, default: 8 },       // hrs/day ke baad overtime
    overtimeRateMultiplier: { type: Number, default: 1.5 },     // 1.5x = time & half
    halfDayCutoffHours:     { type: Number, default: 4 },       // 4 hrs se kam = half day
    // Geo-fence
    defaultGeoFenceRadius:  { type: Number, default: 500 },     // meters
    // Leave defaults per year
    sickLeavePerYear:       { type: Number, default: 12 },
    casualLeavePerYear:     { type: Number, default: 12 },
    earnedLeavePerYear:     { type: Number, default: 15 },
    // OTP settings
    otpMethod:              { type: String, enum: ["email","sms","both"], default: "email" },
    // PDF footer text
    pdfFooterText:          { type: String, default: null },
  },
  { timestamps: true }
);

// Singleton — sirf ek row
companySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model("CompanySettings", companySettingsSchema);
