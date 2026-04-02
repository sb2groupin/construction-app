const router = require("express").Router();
const { addEmployee, getAllEmployees, getEmployee, updateEmployee, deleteEmployee } = require("../controllers/employee.controller");
const { verifyToken, verifyAdmin, verifyEmployeeOrAdmin } = require("../middleware/auth.middleware");

// Sab routes protected hain
router.use(verifyToken);

router.get("/", verifyAdmin, getAllEmployees);
router.get("/:id", verifyEmployeeOrAdmin, getEmployee);
router.post("/", verifyAdmin, addEmployee);
router.put("/:id", verifyEmployeeOrAdmin, updateEmployee);
router.delete("/:id", verifyAdmin, deleteEmployee);

module.exports = router;
