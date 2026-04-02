const router = require("express").Router();
const { getMonthlySalary, getRangeSalary, getMonthlyReport, markSalaryPaid } = require("../controllers/salary.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");

router.use(verifyToken);
router.get("/monthly-report",  verifyAdmin, getMonthlyReport);
router.get("/month/:id",       getMonthlySalary);
router.get("/range/:id",       getRangeSalary);
router.post("/mark-paid",      verifyAdmin, markSalaryPaid);

module.exports = router;
