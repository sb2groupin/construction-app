// dpr.routes.js
const dprRouter = require("express").Router();
const { submitDPR, getDPRs, addComment } = require("../controllers/dpr.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");
const { uploadDPR } = require("../middleware/upload.middleware");

dprRouter.use(verifyToken);
dprRouter.get("/", getDPRs);
dprRouter.post("/", uploadDPR.array("photos", 5), submitDPR);
dprRouter.patch("/:id/comment", verifyAdmin, addComment);

module.exports = { dprRouter };
