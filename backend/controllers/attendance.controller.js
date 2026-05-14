const path = require("path");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Project = require("../models/Project");
const { isWithinGeoFence } = require("../utils/geo.utils");
const { sendSuccess, sendError } = require("../utils/response.utils");

// ──────────────────────────────────────────────────────────────────
// 1. CHECK-IN (with geofence validation)
// ──────────────────────────────────────────────────────────────────
const markAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, latitude, longitude, deviceId } = req.body;
    if (!employeeId || !date) {
      return sendError(res, "employeeId aur date zaroori hain", 400);
    }

    const emp = await Employee.findOne({ empId: employeeId }).populate('projectId');
    if (!emp) return sendError(res, "Employee not found", 404);

    const today = date || new Date().toISOString().split('T')[0];
    const existing = await Attendance.findOne({ employeeId: emp._id, date: today });
    if (existing) {
      return sendError(res, `${today} ki attendance already mark hai`, 409);
    }

    let isValidLocation = true;
    let distanceFromSite = null;
    let insideGeofence = false;
    let checkInLocation = null;

    if (emp.projectId && latitude && longitude) {
      const project = emp.projectId;
      if (project.siteLatitude && project.siteLongitude) {
        const { isValid, distance } = isWithinGeoFence(
          parseFloat(latitude),
          parseFloat(longitude),
          project.siteLatitude,
          project.siteLongitude,
          project.geoFenceRadius || 500
        );
        isValidLocation = isValid;
        distanceFromSite = distance;
        insideGeofence = isValid;
        checkInLocation = {
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
          timestamp: new Date()
        };
      }
    }

    let selfiePhoto = null;
    if (req.file) selfiePhoto = `/uploads/selfies/${req.file.filename}`;

    const record = new Attendance({
      employeeId: emp._id,
      date: today,
      present: true,
      isHalfDay: false,
      dayValue: 1,
      projectId: emp.projectId?._id || null,
      markedBy: req.user?.role === "admin" ? "admin" : "employee",
      checkInTime: new Date(),
      checkInLocation,
      lastKnownLocation: checkInLocation,
      insideGeofence,
      geofenceEnterTime: insideGeofence ? new Date() : null,
      distanceFromSite,
      isValidLocation,
      selfiePhoto,
      notes: req.body.notes || null,
      syncStatus: deviceId ? 'pending' : 'synced',
      deviceId: deviceId || null,
      status: 'pending'
    });

    await record.save();

    const message = !isValidLocation
      ? `⚠️ Check-in saved but location invalid — ${distanceFromSite}m site se door`
      : `Check-in done ✅ ${insideGeofence ? 'Inside geofence' : 'Outside geofence'}`;

    return sendSuccess(res, { attendance: record, insideGeofence, distanceFromSite }, message, 201);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────────────
// 2. CHECK-OUT (calculate working hours from geofence time)
// ──────────────────────────────────────────────────────────────────
const checkOut = async (req, res, next) => {
  try {
    const { employeeId, date, latitude, longitude, deviceId, reason } = req.body;
    const today = date || new Date().toISOString().split("T")[0];

    const emp = await Employee.findOne({ empId: employeeId });
    if (!emp) return sendError(res, "Employee not found", 404);

    const record = await Attendance.findOne({ employeeId: emp._id, date: today });
    if (!record) return sendError(res, "Pehle check-in karo", 404);
    if (record.checkOutTime) return sendError(res, "Already checked out", 409);

    let checkOutLocation = null;
    let insideAtCheckout = false;
    if (latitude && longitude && emp.projectId) {
      const project = await Project.findById(emp.projectId);
      if (project?.siteLatitude && project?.siteLongitude) {
        const { isValid } = isWithinGeoFence(
          parseFloat(latitude),
          parseFloat(longitude),
          project.siteLatitude,
          project.siteLongitude,
          project.geoFenceRadius || 500
        );
        insideAtCheckout = isValid;
        checkOutLocation = {
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
          timestamp: new Date()
        };
      }
    }

    record.checkOutTime = new Date();
    record.checkOutLocation = checkOutLocation;

    // Working hours based on geofence entry/exit
    let workingHours = 0;
    if (record.geofenceEnterTime) {
      const exitTime = record.geofenceExitTime || record.checkOutTime;
      workingHours = (exitTime - record.geofenceEnterTime) / (1000 * 60 * 60);
      workingHours = parseFloat(workingHours.toFixed(2));
    } else if (record.checkInTime) {
      workingHours = (record.checkOutTime - record.checkInTime) / (1000 * 60 * 60);
      workingHours = parseFloat(workingHours.toFixed(2));
    }
    record.workingHours = workingHours;

    record.insideGeofence = insideAtCheckout;
    if (!insideAtCheckout) record.geofenceExitTime = record.checkOutTime;

    // Overtime calculation (standard 9 hours, can be made configurable)
    const standardHours = emp.standardWorkingHours || 9;
    if (workingHours > standardHours) {
      record.overtimeHours = parseFloat((workingHours - standardHours).toFixed(2));
    } else {
      record.overtimeHours = 0;
    }

    // Half-day logic
    if (workingHours < 4 && workingHours > 0) {
      record.isHalfDay = true;
      record.dayValue = 0.5;
    } else if (workingHours >= 4) {
      record.isHalfDay = false;
      record.dayValue = 1;
    }

    if (reason) record.checkOutReason = reason;
    if (deviceId) record.syncStatus = 'pending';
    await record.save();

    return sendSuccess(res, { attendance: record, workingHours }, "Check-out done ✅");
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────────────
// 3. UPDATE LAST KNOWN LOCATION (periodic call during work)
// ──────────────────────────────────────────────────────────────────
const updateLocation = async (req, res, next) => {
  try {
    const { employeeId, latitude, longitude, deviceId } = req.body;
    if (!employeeId || latitude === undefined || longitude === undefined) {
      return sendError(res, "employeeId, latitude, longitude required", 400);
    }

    const emp = await Employee.findOne({ empId: employeeId });
    if (!emp) return sendError(res, "Employee not found", 404);

    const today = new Date().toISOString().split("T")[0];
    const record = await Attendance.findOne({ employeeId: emp._id, date: today });
    if (!record) return sendError(res, "No active attendance for today", 404);
    if (record.checkOutTime) return sendError(res, "Already checked out", 400);

    // Update last known location
    record.lastKnownLocation = {
      lat: parseFloat(latitude),
      lng: parseFloat(longitude),
      timestamp: new Date()
    };

    // Check geofence status
    let inside = false;
    if (emp.projectId) {
      const project = await Project.findById(emp.projectId);
      if (project?.siteLatitude && project?.siteLongitude) {
        const { isValid } = isWithinGeoFence(
          parseFloat(latitude),
          parseFloat(longitude),
          project.siteLatitude,
          project.siteLongitude,
          project.geoFenceRadius || 500
        );
        inside = isValid;
      }
    }

    // Update enter/exit times if status changed
    if (record.insideGeofence && !inside) {
      record.geofenceExitTime = new Date();
      record.insideGeofence = false;
    } else if (!record.insideGeofence && inside) {
      record.geofenceEnterTime = new Date();
      record.insideGeofence = true;
    }

    if (deviceId) record.syncStatus = 'pending';
    await record.save();

    return sendSuccess(res, { insideGeofence: inside, lastKnownLocation: record.lastKnownLocation }, "Location updated");
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────────────
// 4. GET ATTENDANCE (with filters)
// ──────────────────────────────────────────────────────────────────
const getAttendance = async (req, res, next) => {
  try {
    const { employeeId, month, year, startDate, endDate, projectId, insideGeofence } = req.query;
    const filter = {};

    if (req.user.role === "employee") {
      const emp = await Employee.findOne({ empId: req.user.employeeId });
      filter.employeeId = emp ? emp._id : null;
    } else if (employeeId) {
      const emp = await Employee.findOne({ empId: employeeId });
      filter.employeeId = emp ? emp._id : null;
    }

    if (projectId) filter.projectId = projectId;
    if (insideGeofence !== undefined) filter.insideGeofence = insideGeofence === 'true';

    if (month && year) {
      const monthStr = String(month).padStart(2, "0");
      const lastDay = new Date(year, month, 0).getDate();
      filter.date = {
        $gte: `${year}-${monthStr}-01`,
        $lte: `${year}-${monthStr}-${lastDay}`,
      };
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(filter)
      .populate('employeeId', 'name empId')
      .sort({ date: -1 });
    return sendSuccess(res, { attendance: records, total: records.length });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────────────
// 5. UPDATE ATTENDANCE (admin only)
// ──────────────────────────────────────────────────────────────────
const updateAttendance = async (req, res, next) => {
  try {
    const updates = req.body;
    const record = await Attendance.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!record) return sendError(res, "Attendance record not found", 404);
    return sendSuccess(res, { attendance: record }, "Attendance updated");
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────────────
// 6. TODAY'S SUMMARY
// ──────────────────────────────────────────────────────────────────
const getTodaySummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { projectId } = req.query;
    const filter = { date: today };
    if (projectId) filter.projectId = projectId;

    const present = await Attendance.countDocuments({ ...filter, present: true });
    const absent = await Attendance.countDocuments({ ...filter, present: false });
    const totalEmployees = await Employee.countDocuments({ isActive: true });

    return sendSuccess(res, {
      today,
      present,
      absent,
      totalEmployees,
      notMarked: totalEmployees - present - absent
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────────────
// 7. FLAGGED ATTENDANCE (invalid location)
// ──────────────────────────────────────────────────────────────────
const getFlaggedAttendance = async (req, res, next) => {
  try {
    const { projectId, month, year } = req.query;
    const filter = { isValidLocation: false };
    if (projectId) filter.projectId = projectId;

    if (month && year) {
      const monthStr = String(month).padStart(2, "0");
      const lastDay = new Date(year, month, 0).getDate();
      filter.date = { $gte: `${year}-${monthStr}-01`, $lte: `${year}-${monthStr}-${lastDay}` };
    }

    const records = await Attendance.find(filter)
      .populate("employeeId", "name empId")
      .sort({ date: -1 });
    return sendSuccess(res, { flagged: records, total: records.length });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────────────
// 8. CURRENT ACTIVE EMPLOYEES (checked-in but not checked-out)
// ──────────────────────────────────────────────────────────────────
const getCurrentActive = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const active = await Attendance.find({
      date: today,
      checkInTime: { $ne: null },
      checkOutTime: null
    }).populate('employeeId', 'name empId');
    return sendSuccess(res, { active }, `${active.length} employees currently active`);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────────────
// 9. SYNC PENDING RECORDS (offline support)
// ──────────────────────────────────────────────────────────────────
const syncPending = async (req, res, next) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return sendError(res, "Valid records array required", 400);
    }

    const results = [];
    for (const rec of records) {
      try {
        const existing = await Attendance.findOne({ employeeId: rec.employeeId, date: rec.date });
        if (existing) {
          results.push({ ...rec, status: 'skipped', reason: 'already exists' });
          continue;
        }
        const newRecord = new Attendance({ ...rec, syncStatus: 'synced' });
        await newRecord.save();
        results.push({ ...rec, status: 'synced' });
      } catch (err) {
        results.push({ ...rec, status: 'failed', error: err.message });
      }
    }
    return sendSuccess(res, { synced: results }, `${results.filter(r => r.status === 'synced').length} records synced`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  markAttendance,
  checkOut,
  updateLocation,
  getAttendance,
  updateAttendance,
  getTodaySummary,
  getFlaggedAttendance,
  getCurrentActive,
  syncPending
};