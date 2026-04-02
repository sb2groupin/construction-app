const router = require("express").Router();
const { submitExpense, getExpenses, reviewExpense, getPettyCash, addPettyCash } = require("../controllers/expense.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");
const { uploadExpense } = require("../middleware/upload.middleware");

router.use(verifyToken);
router.get("/",                   getExpenses);
router.post("/",                  uploadExpense.single("bill"), submitExpense);
router.patch("/:id/review",       verifyAdmin, reviewExpense);
router.get("/petty-cash",         getPettyCash);
router.post("/petty-cash",        verifyAdmin, addPettyCash);

module.exports = router;
