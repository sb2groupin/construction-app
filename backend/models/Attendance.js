const mongoose = require("mongoose");

// Location sub-schema (reusable)
const locationPointSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const attendanceSchema = new mongoose.Schema(
  {
    // References
    employeeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employee", 
      required: true 
    },
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      default: null 
    },
    date: { type: String, required: true }, // YYYY-MM-DD

    // Status flags
    present: { type: Boolean, required: true, default: false },
    isHalfDay: { type: Boolean, default: false },
    dayValue: { type: Number, default: 1 }, // 1=full, 0.5=half, 0=absent

    // Check-in / Check-out
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    workingHours: { type: Number, default: null },
    overtimeHours: { type: Number, default: 0 },

    // GEO / Location
    checkInLocation: locationPointSchema,
    checkOutLocation: locationPointSchema,
    lastKnownLocation: locationPointSchema,
    distanceFromSite: { type: Number, default: null },
    isValidLocation: { type: Boolean, default: true },

    // Geofence tracking
    insideGeofence: { type: Boolean, default: false },
    geofenceEnterTime: { type: Date, default: null },
    geofenceExitTime: { type: Date, default: null },
    totalTimeInsideGeofence: { type: Number, default: 0 }, // seconds

    // Offline support
    syncStatus: { type: String, enum: ['synced', 'pending'], default: 'synced' },
    deviceId: { type: String, default: null },

    // Additional
    selfiePhoto: { type: String, default: null },
    markedBy: { type: String, enum: ['employee', 'admin'], default: 'employee' },
    notes: { type: String, default: null },
    checkOutReason: { type: String, default: null },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    }
  },
  { timestamps: true }
);

// Indexes
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ employeeId: 1, insideGeofence: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ projectId: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);