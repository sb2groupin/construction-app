const router = require("express").Router();
const { createTask, getTasks, updateTask, deleteTask, getOverdueTasks } = require("../controllers/task.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");
const { uploadDPR } = require("../middleware/upload.middleware");

router.use(verifyToken);
router.get("/",           getTasks);
router.get("/overdue",    verifyAdmin, getOverdueTasks);
router.post("/",          verifyAdmin, createTask);
router.put("/:id",        uploadDPR.single("photo"), updateTask);
router.delete("/:id",     verifyAdmin, deleteTask);

module.exports = router;
