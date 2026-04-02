const router = require("express").Router();
const { requestAdvance, getAdvances, approveAdvance, rejectAdvance, getAdvanceSummary } = require("../controllers/advance.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");

router.use(verifyToken);
router.get("/",                  getAdvances);
router.get("/summary/:empId",    verifyAdmin, getAdvanceSummary);
router.post("/",                 requestAdvance);
router.patch("/:id/approve",     verifyAdmin, approveAdvance);
router.patch("/:id/reject",      verifyAdmin, rejectAdvance);

module.exports = router;
