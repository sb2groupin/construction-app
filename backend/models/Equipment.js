const mongoose = require("mongoose");

const usageLogSchema = new mongoose.Schema({
  date:          { type: String, required: true },
  hoursUsed:     { type: Number, default: 0 },
  operatorName:  { type: String, default: null },
  fuelCost:      { type: Number, default: 0 },
  notes:         { type: String, default: null },
}, { timestamps: true });

const equipmentSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true },  // JCB, Mixer, Generator, Vibrator
    type:         { type: String, default: "Other" },
    registrationNo: { type: String, default: null },
    projectId:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    status:       { type: String, enum: ["Active","Idle","Under Maintenance","Retired"], default: "Active" },
    // Maintenance
    lastServiceDate:  { type: String, default: null },
    nextServiceDate:  { type: String, default: null },
    maintenanceNotes: { type: String, default: null },
    // Usage log
    usageLogs:    [usageLogSchema],
    totalHours:   { type: Number, default: 0 },
    totalFuelCost:{ type: Number, default: 0 },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Equipment", equipmentSchema);
