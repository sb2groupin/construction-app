const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/response.utils");

// Token verify karo — har protected route pe
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return sendError(res, "No token provided. Please login first.", 401);
  }

  // "Bearer <token>" format handle karo
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, "Invalid or expired token. Please login again.", 401);
  }
};

// Admin only routes ke liye
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return sendError(res, "Access denied. Admin only.", 403);
  }
  next();
};

// Employee apna data access kare — admin bhi access kar sake
const verifyEmployeeOrAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, "Not authenticated.", 401);
  }

  if (req.user.role === "admin") {
    return next();
  }

  const requestedEmployeeId = req.params.id || req.body.employeeId;

  if (req.user.role === "employee" && requestedEmployeeId && requestedEmployeeId !== req.user.employeeId) {
    return sendError(res, "Access denied. You can only access your own profile.", 403);
  }

  next();
};

module.exports = { verifyToken, verifyAdmin, verifyEmployeeOrAdmin };
