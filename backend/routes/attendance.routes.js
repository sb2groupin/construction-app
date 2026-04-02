const router = require("express").Router();
const { markAttendance, checkOut, getAttendance, updateAttendance, getTodaySummary, getFlaggedAttendance } = require("../controllers/attendance.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");
const { uploadSelfie } = require("../middleware/upload.middleware");

router.use(verifyToken);

router.get("/",               getAttendance);
router.get("/today-summary",  getTodaySummary);
router.get("/flagged",        verifyAdmin, getFlaggedAttendance);
router.post("/",              uploadSelfie.single("selfie"), markAttendance);
router.post("/checkout",      checkOut);
router.put("/:id",            verifyAdmin, updateAttendance);

module.exports = router;
