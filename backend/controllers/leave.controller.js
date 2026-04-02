const Leave    = require("../models/Leave");
const Employee = require("../models/Employee");
const { createNotification } = require("./notification.controller");
const { sendSuccess, sendError } = require("../utils/response.utils");

const calcDays = (start, end) => {
  const diff = Math.ceil((new Date(end) - new Date(start)) / (1000*60*60*24)) + 1;
  return diff > 0 ? diff : 1;
};

const applyLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate, reason, isHalfDay } = req.body;
    if (!type || !startDate || !endDate || !reason) return sendError(res, "type, startDate, endDate, reason zaroori hain", 400);
    const empId = req.user.role === "employee" ? req.user.employeeId : req.body.employeeId;
    if (!empId) return sendError(res, "employeeId missing", 400);
    const emp = await Employee.findOne({ empId });
    const totalDays = isHalfDay ? 0.5 : calcDays(startDate, endDate);
    const leave = new Leave({ employeeId: empId, employeeName: emp?.name || "", type, startDate, endDate, totalDays, reason, isHalfDay: !!isHalfDay });
    await leave.save();
    // Notify admin
    await createNotification({ recipientId: "admin", recipientRole: "admin", type: "leave_approved", title: "New Leave Request", message: `${emp?.name || empId} ne ${type} leave apply ki (${totalDays} days)`, link: "/leaves" });
    return sendSuccess(res, { leave }, "Leave application submitted", 201);
  } catch (err) { next(err); }
};

const getLeaves = async (req, res, next) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};
    if (req.user.role === "employee") filter.employeeId = req.user.employeeId;
    else if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    const leaves = await Leave.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, { leaves, total: leaves.length });
  } catch (err) { next(err); }
};

const approveLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id,
      { status: "Approved", adminRemark: req.body.remark || "Approved", reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    );
    if (!leave) return sendError(res, "Leave not found", 404);

    // Auto-deduct leave balance
    const typeMap = { Sick: "sick", Casual: "casual", Earned: "earned" };
    const balKey  = typeMap[leave.type];
    if (balKey) {
      await Employee.findOneAndUpdate(
        { empId: leave.employeeId },
        { $inc: { [`leaveBalance.${balKey}`]: -leave.totalDays } }
      );
    }

    // Notify employee
    await createNotification({ recipientId: leave.employeeId, recipientRole: "employee", type: "leave_approved", title: "Leave Approved ✅", message: `Aapki ${leave.type} leave (${leave.totalDays} days) approve ho gayi`, link: "/my-leaves" });

    return sendSuccess(res, { leave }, "Leave approved ✅");
  } catch (err) { next(err); }
};

const rejectLeave = async (req, res, next) => {
  try {
    if (!req.body.remark) return sendError(res, "Rejection reason zaroori hai", 400);
    const leave = await Leave.findByIdAndUpdate(req.params.id,
      { status: "Rejected", adminRemark: req.body.remark, reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    );
    if (!leave) return sendError(res, "Leave not found", 404);
    await createNotification({ recipientId: leave.employeeId, recipientRole: "employee", type: "leave_rejected", title: "Leave Rejected ❌", message: `Aapki ${leave.type} leave reject ho gayi. Reason: ${req.body.remark}`, link: "/my-leaves" });
    return sendSuccess(res, { leave }, "Leave rejected");
  } catch (err) { next(err); }
};

const deleteLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return sendError(res, "Leave not found", 404);
    if (leave.status !== "Pending") return sendError(res, "Sirf pending leave cancel ho sakti hai", 400);
    await leave.deleteOne();
    return sendSuccess(res, {}, "Leave cancelled");
  } catch (err) { next(err); }
};

const getPendingCount = async (req, res, next) => {
  try {
    const count = await Leave.countDocuments({ status: "Pending" });
    return sendSuccess(res, { pendingLeaves: count });
  } catch (err) { next(err); }
};

module.exports = { applyLeave, getLeaves, approveLeave, rejectLeave, deleteLeave, getPendingCount };
