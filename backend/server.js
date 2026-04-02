const path    = require("path");
require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/error.middleware");

const authRoutes            = require("./routes/auth.routes");
const employeeRoutes        = require("./routes/employee.routes");
const attendanceRoutes      = require("./routes/attendance.routes");
const salaryRoutes          = require("./routes/salary.routes");
const projectRoutes         = require("./routes/project.routes");
const leaveRoutes           = require("./routes/leave.routes");
const { dprRouter }         = require("./routes/dpr.routes");
const inventoryRoutes       = require("./routes/inventory.routes");
const expenseRoutes         = require("./routes/expense.routes");
const taskRoutes            = require("./routes/task.routes");
const noticeRoutes          = require("./routes/notice.routes");
const companySettingsRoutes = require("./routes/companySettings.routes");
const advanceRoutes         = require("./routes/advance.routes");
const quotationRoutes       = require("./routes/quotation.routes");
const notificationRoutes    = require("./routes/notification.routes");
const subcontractorRoutes   = require("./routes/subcontractor.routes");
const equipmentRoutes       = require("./routes/equipment.routes");

const app = express();

try {
  const rateLimit = require("express-rate-limit");
  const limiter = rateLimit({ windowMs: 15*60*1000, max: 20, message: { success: false, message: "Too many requests, retry after 15 mins" } });
  app.use("/api/auth/login",   limiter);
  app.use("/api/auth/refresh", limiter);
} catch(_) {}

try {
  const mongoSanitize = require("express-mongo-sanitize");
  app.use(mongoSanitize());
} catch(_) {}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.use("/api/auth",            authRoutes);
app.use("/api/employees",       employeeRoutes);
app.use("/api/attendance",      attendanceRoutes);
app.use("/api/salary",          salaryRoutes);
app.use("/api/projects",        projectRoutes);
app.use("/api/leaves",          leaveRoutes);
app.use("/api/dpr",             dprRouter);
app.use("/api/inventory",       inventoryRoutes);
app.use("/api/expenses",        expenseRoutes);
app.use("/api/tasks",           taskRoutes);
app.use("/api",                 noticeRoutes);
app.use("/api/settings",        companySettingsRoutes);
app.use("/api/advances",        advanceRoutes);
app.use("/api",                 quotationRoutes);
app.use("/api/notifications",   notificationRoutes);
app.use("/api/subcontractors",  subcontractorRoutes);
app.use("/api/equipment",       equipmentRoutes);

app.get("/api/health", (req, res) => res.json({ success: true, message: "Server running ✅" }));
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
