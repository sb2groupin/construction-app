const router = require("express").Router();
const {
  getAllProjects, getProject, addProject, updateProject,
  deleteProject, assignEmployee, getProjectsSummary,
} = require("../controllers/project.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");

router.use(verifyToken);

router.get("/summary",          verifyAdmin, getProjectsSummary);
router.get("/",                 getAllProjects);
router.get("/:id",              getProject);
router.post("/",                verifyAdmin, addProject);
router.put("/:id",              verifyAdmin, updateProject);
router.delete("/:id",           verifyAdmin, deleteProject);
router.post("/:id/assign",      verifyAdmin, assignEmployee);

module.exports = router;
