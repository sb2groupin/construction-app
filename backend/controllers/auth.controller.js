const jwt      = require("jsonwebtoken");
const bcrypt   = require("bcryptjs");
const User     = require("../models/User");
const { sendSuccess, sendError } = require("../utils/response.utils");

const generateTokens = (user) => {
  const payload = { id: user._id, role: user.role, employeeId: user.employeeId };
  const accessToken  = jwt.sign(payload, process.env.JWT_SECRET,         { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d"  });
  return { accessToken, refreshToken };
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return sendError(res, "Username aur password dono zaroori hain", 400);
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user || !user.isActive) return sendError(res, "Invalid username ya password", 401);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, "Invalid username ya password", 401);
    const { accessToken, refreshToken } = generateTokens(user);
    // Refresh token store karo
    user.refreshToken = refreshToken;
    await user.save();
    return sendSuccess(res, {
      token: accessToken, refreshToken,
      role: user.role, username: user.username, employeeId: user.employeeId,
    }, "Login successful");
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, "Refresh token zaroori hai", 401);
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) return sendError(res, "Invalid refresh token", 401);
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    return sendSuccess(res, { token: tokens.accessToken, refreshToken: tokens.refreshToken }, "Token refreshed");
  } catch (err) {
    return sendError(res, "Invalid ya expired refresh token", 401);
  }
};

const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    return sendSuccess(res, {}, "Logged out");
  } catch (err) { next(err); }
};

const createEmployeeLogin = async (req, res, next) => {
  try {
    const { username, password, employeeId } = req.body;
    if (!username || !password || !employeeId) return sendError(res, "username, password, employeeId zaroori hain", 400);
    // Password strength check
    const strongPass = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!strongPass.test(password)) return sendError(res, "Password mein min 8 chars, 1 number, 1 special character zaroori hai", 400);
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) return sendError(res, "Ye username already exists", 409);
    const user = new User({ username: username.toLowerCase(), password, role: "employee", employeeId });
    await user.save();
    return sendSuccess(res, { username: user.username, employeeId }, "Employee login created", 201);
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const strongPass = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!strongPass.test(newPassword)) return sendError(res, "Password mein min 8 chars, 1 number, 1 special char zaroori hai", 400);
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, "User not found", 404);
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return sendError(res, "Old password galat hai", 400);
    user.password = newPassword;
    await user.save();
    return sendSuccess(res, {}, "Password changed ✅");
  } catch (err) { next(err); }
};

const resetPasswordByAdmin = async (req, res, next) => {
  try {
    const { username, newPassword } = req.body;
    const user = await User.findOne({ username: username?.toLowerCase() });
    if (!user) return sendError(res, "User not found", 404);
    user.password = newPassword;
    await user.save();
    return sendSuccess(res, {}, "Password reset successfully");
  } catch (err) { next(err); }
};

// Admin force-logout kisi bhi user ko
const forceLogout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { refreshToken: null });
    return sendSuccess(res, {}, "User force-logged out");
  } catch (err) { next(err); }
};

// All active sessions (users with refresh tokens)
const getActiveSessions = async (req, res, next) => {
  try {
    const users = await User.find({ refreshToken: { $ne: null } }).select("username role employeeId updatedAt");
    return sendSuccess(res, { sessions: users });
  } catch (err) { next(err); }
};

module.exports = { login, refreshToken, logout, createEmployeeLogin, changePassword, resetPasswordByAdmin, forceLogout, getActiveSessions };
