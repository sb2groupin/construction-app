const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId:  { type: String, required: true },
    projectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    date:        { type: String, required: true },
    // Status
    present:     { type: Boolean, required: true },
    isHalfDay:   { type: Boolean, default: false },     // half day flag
    dayValue:    { type: Number, default: 1 },           // 1=full, 0.5=half, 0=absent
    // Check-in / Check-out
    checkInTime:    { type: Date, default: null },
    checkOutTime:   { type: Date, default: null },
    workingHours:   { type: Number, default: null },
    overtimeHours:  { type: Number, default: 0 },       // auto-detect from working hours
    // Geo
    location: {
      latitude:         { type: Number, default: null },
      longitude:        { type: Number, default: null },
      distanceFromSite: { type: Number, default: null },
      isValid:          { type: Boolean, default: true },
    },
    selfiePhoto: { type: String, default: null },
    markedBy:    { type: String, default: "admin" },
    notes:       { type: String, default: null },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
