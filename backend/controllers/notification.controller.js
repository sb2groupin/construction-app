const Notification = require("../models/Notification");
const { sendSuccess, sendError } = require("../utils/response.utils");

// Create notification helper (used internally by other controllers)
const createNotification = async ({ recipientId, recipientRole, type, title, message, link, data }) => {
  try {
    await Notification.create({ recipientId, recipientRole, type, title, message, link, data });
  } catch (err) {
    console.error("Notification create failed:", err.message);
  }
};

// Get notifications for current user
const getNotifications = async (req, res, next) => {
  try {
    const recipientId = req.user.role === "admin" ? "admin" : req.user.employeeId;
    const notifications = await Notification.find({ recipientId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ recipientId, isRead: false });
    return sendSuccess(res, { notifications, unreadCount });
  } catch (err) { next(err); }
};

// Mark single as read
const markRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    return sendSuccess(res, {}, "Marked as read");
  } catch (err) { next(err); }
};

// Mark all as read
const markAllRead = async (req, res, next) => {
  try {
    const recipientId = req.user.role === "admin" ? "admin" : req.user.employeeId;
    await Notification.updateMany({ recipientId, isRead: false }, { isRead: true });
    return sendSuccess(res, {}, "All marked as read");
  } catch (err) { next(err); }
};

// Unread count only (for bell icon)
const getUnreadCount = async (req, res, next) => {
  try {
    const recipientId = req.user.role === "admin" ? "admin" : req.user.employeeId;
    const count = await Notification.countDocuments({ recipientId, isRead: false });
    return sendSuccess(res, { count });
  } catch (err) { next(err); }
};

// Delete old notifications
const clearAll = async (req, res, next) => {
  try {
    const recipientId = req.user.role === "admin" ? "admin" : req.user.employeeId;
    await Notification.deleteMany({ recipientId });
    return sendSuccess(res, {}, "Notifications cleared");
  } catch (err) { next(err); }
};

module.exports = { createNotification, getNotifications, markRead, markAllRead, getUnreadCount, clearAll };
