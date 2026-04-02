const router = require("express").Router();
const { getAll, create, update, remove, addUsage, markServiceDone } = require("../controllers/equipment.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");

router.use(verifyToken);
router.get("/",                   getAll);
router.post("/",        verifyAdmin, create);
router.put("/:id",      verifyAdmin, update);
router.delete("/:id",   verifyAdmin, remove);
router.post("/:id/usage",          addUsage);
router.post("/:id/service", verifyAdmin, markServiceDone);

module.exports = router;
