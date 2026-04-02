const router = require("express").Router();
const { login, refreshToken, logout, createEmployeeLogin, changePassword, resetPasswordByAdmin, forceLogout, getActiveSessions } = require("../controllers/auth.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");

router.post("/login",                    login);
router.post("/refresh",                  refreshToken);
router.post("/logout",                   verifyToken, logout);
router.post("/create-employee-login",    verifyToken, verifyAdmin, createEmployeeLogin);
router.put("/change-password",           verifyToken, changePassword);
router.put("/reset-password",            verifyToken, verifyAdmin, resetPasswordByAdmin);
router.post("/force-logout/:userId",     verifyToken, verifyAdmin, forceLogout);
router.get("/sessions",                  verifyToken, verifyAdmin, getActiveSessions);

module.exports = router;
