// companySettings.routes.js
const router = require("express").Router();
const { getSettings, updateSettings } = require("../controllers/companySettings.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");

router.get("/",  verifyToken, getSettings);
router.put("/",  verifyToken, verifyAdmin, updateSettings);

module.exports = router;
