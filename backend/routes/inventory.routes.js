const router = require("express").Router();
const { getInventory, addMaterial, receiveStock, useStock, getTransactions, createRequest, getRequests, reviewRequest } = require("../controllers/inventory.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");
const { uploadExpense } = require("../middleware/upload.middleware");

router.use(verifyToken);
router.get("/",                      getInventory);
router.post("/",          verifyAdmin, addMaterial);
router.post("/receive",              uploadExpense.single("bill"), receiveStock);
router.post("/use",                  useStock);
router.get("/transactions",          getTransactions);
router.get("/requests",              getRequests);
router.post("/requests",             createRequest);
router.patch("/requests/:id",        verifyAdmin, reviewRequest);

module.exports = router;
