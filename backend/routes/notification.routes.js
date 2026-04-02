const router = require("express").Router();
const { getNotifications, markRead, markAllRead, getUnreadCount, clearAll } = require("../controllers/notification.controller");
const { verifyToken } = require("../middleware/auth.middleware");

router.use(verifyToken);
router.get("/",           getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markRead);
router.post("/mark-all-read", markAllRead);
router.delete("/clear",   clearAll);

module.exports = router;
