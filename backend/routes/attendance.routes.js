const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin, verifyEmployeeOrAdmin } = require("../middleware/auth.middleware");
const { uploadSelfie } = require("../middleware/upload.middleware");
const {
  markAttendance,
  checkOut,
  updateLocation,
  getAttendance,
  updateAttendance,
  getTodaySummary,
  getFlaggedAttendance,
  getCurrentActive,
  syncPending
} = require("../controllers/attendance.controller");

// All routes require authentication
router.use(verifyToken);

// ──────────────────────────────────────────────
// Employee & Admin routes
router.post("/checkin", verifyEmployeeOrAdmin, uploadSelfie.single("selfie"), markAttendance);
router.post("/checkout", verifyEmployeeOrAdmin, checkOut);
router.post("/location", verifyEmployeeOrAdmin, updateLocation);
router.get("/my", getAttendance);
router.get("/today-summary", getTodaySummary);
router.post("/sync", syncPending);

// ──────────────────────────────────────────────
// Admin only routes
router.get("/", verifyAdmin, getAttendance);
router.put("/:id", verifyAdmin, updateAttendance);
router.get("/flagged", verifyAdmin, getFlaggedAttendance);
router.get("/active", verifyAdmin, getCurrentActive);

module.exports = router;