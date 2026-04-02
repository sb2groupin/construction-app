const router = require("express").Router();
const { reportIncident, getIncidents, updateIncident, createNotice, getNotices, deleteNotice } = require("../controllers/notice.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");
const { uploadDPR } = require("../middleware/upload.middleware");

router.use(verifyToken);
// Notices
router.get("/notices",            getNotices);
router.post("/notices",           verifyAdmin, createNotice);
router.delete("/notices/:id",     verifyAdmin, deleteNotice);
// Incidents
router.get("/incidents",          getIncidents);
router.post("/incidents",         uploadDPR.single("photo"), reportIncident);
router.patch("/incidents/:id",    verifyAdmin, updateIncident);

module.exports = router;
