const router = require("express").Router();
const {
  applyLeave, getLeaves, approveLeave, rejectLeave, deleteLeave, getPendingCount,
} = require("../controllers/leave.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");

router.use(verifyToken);

router.get("/pending-count",    verifyAdmin, getPendingCount);
router.get("/",                 getLeaves);
router.post("/",                applyLeave);
router.patch("/:id/approve",    verifyAdmin, approveLeave);
router.patch("/:id/reject",     verifyAdmin, rejectLeave);
router.delete("/:id",           deleteLeave);

module.exports = router;
