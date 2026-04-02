const router = require("express").Router();
const { getAll, create, update, remove, addPayment } = require("../controllers/subcontractor.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");
const { uploadExpense } = require("../middleware/upload.middleware");

router.use(verifyToken);
router.get("/",                  getAll);
router.post("/",      verifyAdmin, create);
router.put("/:id",    verifyAdmin, update);
router.delete("/:id", verifyAdmin, remove);
router.post("/:id/payment", verifyAdmin, uploadExpense.single("receipt"), addPayment);

module.exports = router;
