const dns = require("node:dns");
const path = require("path");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { getFirstDefinedEnv } = require("./config/env");
const { errorHandler, notFound } = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employee.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const salaryRoutes = require("./routes/salary.routes");
const projectRoutes = require("./routes/project.routes");
const leaveRoutes = require("./routes/leave.routes");
const { dprRouter } = require("./routes/dpr.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const expenseRoutes = require("./routes/expense.routes");
const taskRoutes = require("./routes/task.routes");
const noticeRoutes = require("./routes/notice.routes");
const companySettingsRoutes = require("./routes/companySettings.routes");
const advanceRoutes = require("./routes/advance.routes");
const quotationRoutes = require("./routes/quotation.routes");
const notificationRoutes = require("./routes/notification.routes");
const subcontractorRoutes = require("./routes/subcontractor.routes");
const equipmentRoutes = require("./routes/equipment.routes");

dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
console.log("DNS servers set for MongoDB connection.");

const app = express();

try {
  const rateLimit = require("express-rate-limit");
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: "Too many requests, retry after 15 mins" },
  });

  app.use("/api/auth/login", limiter);
  app.use("/api/auth/refresh", limiter);
} catch (_) {}

try {
  const mongoSanitize = require("express-mongo-sanitize");
  app.use(mongoSanitize());
} catch (_) {}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: getFirstDefinedEnv("FRONTEND_URL") || "http://localhost:3000",
    credentials: true,
  })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/dpr", dprRouter);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", noticeRoutes);
app.use("/api/settings", companySettingsRoutes);
app.use("/api/advances", advanceRoutes);
app.use("/api", quotationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/subcontractors", subcontractorRoutes);
app.use("/api/equipment", equipmentRoutes);

app.get("/api/health", (req, res) => res.json({ success: true, message: "Server running." }));
app.use(notFound);
app.use(errorHandler);

const PORT = Number(getFirstDefinedEnv("PORT") || 5001);

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => console.log(`Server on port ${PORT}`));

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Update backend/.env PORT or stop the process using that port.`);
        process.exit(1);
      }

      throw err;
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

startServer();
