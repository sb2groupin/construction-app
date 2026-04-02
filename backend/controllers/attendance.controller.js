const path       = require("path");
const Attendance = require("../models/Attendance");
const Employee   = require("../models/Employee");
const Project    = require("../models/Project");
const { isWithinGeoFence } = require("../utils/geo.utils");
const { sendSuccess, sendError } = require("../utils/response.utils");

// Mark attendance — geo-fencing + selfie support
const markAttendance = async (req, res, next) => {
  try {
    const {
      employeeId, date, present, notes,
      latitude, longitude,           // employee ki location
    } = req.body;

    if (!employeeId || !date || present === undefined) {
      return sendError(res, "employeeId, date aur present zaroori hain", 400);
    }

    const emp = await Employee.findOne({ empId: employeeId });
    if (!emp) return sendError(res, "Employee not found", 404);

    // Duplicate check
    const existing = await Attendance.findOne({ employeeId, date });
    if (existing) {
      return sendError(res, `${date} ki attendance already mark ho gayi hai`, 409);
    }

    // ── Geo-fence check ──────────────────────────────────
    let geoData = {
      latitude:         latitude  ? parseFloat(latitude)  : null,
      longitude:        longitude ? parseFloat(longitude) : null,
      distanceFromSite: null,
      isValid:          true,   // default valid
    };

    if (emp.projectId && latitude && longitude) {
      const project = await Project.findById(emp.projectId);

      if (project?.siteLatitude && project?.siteLongitude) {
        const { isValid, distance } = isWithinGeoFence(
          parseFloat(latitude),
          parseFloat(longitude),
          project.siteLatitude,
          project.siteLongitude,
          project.geoFenceRadius || 500
        );
        geoData.distanceFromSite = distance;
        geoData.isValid          = isValid;
      }
    }

    // ── Selfie photo ─────────────────────────────────────
    let selfiePhoto = null;
    if (req.file) {
      selfiePhoto = `/uploads/selfies/${req.file.filename}`;
    }

    const isPresent = present === true || present === "true";

    const record = new Attendance({
      employeeId,
      date,
      present:      isPresent,
      projectId:    emp.projectId || null,
      markedBy:     req.user?.role === "admin" ? "admin" : employeeId,
      checkInTime:  isPresent ? new Date() : null,
      notes,
      selfiePhoto,
      location:     geoData,
    });

    await record.save();

    const message = !geoData.isValid
      ? `⚠️ Attendance saved but location invalid — ${geoData.distanceFromSite}m site se door`
      : "Attendance saved ✅";

    return sendSuccess(res, { attendance: record, geoValid: geoData.isValid }, message, 201);

  } catch (err) {
    next(err);
  }
};

// Get attendance — admin: sab, employee: apna
const getAttendance = async (req, res, next) => {
  try {
    const { employeeId, month, year, startDate, endDate, projectId } = req.query;
    const filter = {};

    // Employee sirf apna dekh sake
    if (req.user.role === "employee") {
      filter.employeeId = req.user.employeeId;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (projectId) filter.projectId = projectId;

    // Date filter
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

    const records = await Attendance.find(filter).sort({ date: -1 });
    return sendSuccess(res, { attendance: records, total: records.length });

  } catch (err) {
    next(err);
  }
};

// Update attendance (admin only — galti sudharni ho)
const updateAttendance = async (req, res, next) => {
  try {
    const { present, notes } = req.body;
    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { present, notes },
      { new: true }
    );
    if (!record) return sendError(res, "Attendance record not found", 404);
    return sendSuccess(res, { attendance: record }, "Attendance updated");
  } catch (err) {
    next(err);
  }
};

// Today's attendance summary
const getTodaySummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { projectId } = req.query;
    const filter = { date: today };
    if (projectId) filter.projectId = projectId;

    const present = await Attendance.countDocuments({ ...filter, present: true });
    const absent = await Attendance.countDocuments({ ...filter, present: false });
    const totalEmployees = await Employee.countDocuments({ isActive: true });

    return sendSuccess(res, { today, present, absent, totalEmployees, notMarked: totalEmployees - present - absent });
  } catch (err) {
    next(err);
  }
};

// Check-out karo
const checkOut = async (req, res, next) => {
  try {
    const { employeeId, date } = req.body;
    const today = date || new Date().toISOString().split("T")[0];

    const record = await Attendance.findOne({ employeeId, date: today });
    if (!record) return sendError(res, "Pehle check-in karo", 404);
    if (record.checkOutTime) return sendError(res, "Already checked out", 409);

    record.checkOutTime = new Date();

    if (record.checkInTime) {
      const diffMs    = record.checkOutTime - record.checkInTime;
      record.workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    await record.save();
    return sendSuccess(res, { attendance: record, workingHours: record.workingHours }, "Check-out done ✅");
  } catch (err) {
    next(err);
  }
};

// Flagged attendance list — admin ke liye (invalid location)
const getFlaggedAttendance = async (req, res, next) => {
  try {
    const { projectId, month, year } = req.query;
    const filter = { "location.isValid": false };
    if (projectId) filter.projectId = projectId;

    if (month && year) {
      const monthStr = String(month).padStart(2, "0");
      const lastDay  = new Date(year, month, 0).getDate();
      filter.date    = { $gte: `${year}-${monthStr}-01`, $lte: `${year}-${monthStr}-${lastDay}` };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });
    return sendSuccess(res, { flagged: records, total: records.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { markAttendance, checkOut, getAttendance, updateAttendance, getTodaySummary, getFlaggedAttendance };
