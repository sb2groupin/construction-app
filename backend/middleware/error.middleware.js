const { sendError } = require("../utils/response.utils");

// Global error handler — server crash hone se bachao
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, `${field} already exists.`, 409);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(res, "Validation failed", 400, messages);
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token", 401);
  }

  // Default
  return sendError(res, err.message || "Server error", err.statusCode || 500);
};

// 404 handler
const notFound = (req, res) => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
};

module.exports = { errorHandler, notFound };
