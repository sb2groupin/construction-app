const router = require("express").Router();
const { getAllQuotations, createQuotation, updateQuotation, deleteQuotation, convertToAgreement, getAllAgreements, updateAgreement, signAgreement } = require("../controllers/quotation.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");

router.use(verifyToken, verifyAdmin);
// Quotations
router.get("/quotations",                    getAllQuotations);
router.post("/quotations",                   createQuotation);
router.put("/quotations/:id",                updateQuotation);
router.delete("/quotations/:id",             deleteQuotation);
router.post("/quotations/:id/to-agreement",  convertToAgreement);
// Agreements
router.get("/agreements",                    getAllAgreements);
router.put("/agreements/:id",                updateAgreement);
router.patch("/agreements/:id/sign",         signAgreement);

module.exports = router;
