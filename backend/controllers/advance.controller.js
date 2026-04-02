const Advance  = require("../models/Advance");
const Employee = require("../models/Employee");
const { sendSuccess, sendError } = require("../utils/response.utils");

// Employee advance request kare
const requestAdvance = async (req, res, next) => {
  try {
    const { amount, reason, monthlyDeduction } = req.body;
    if (!amount) return sendError(res, "Amount zaroori hai", 400);

    const empId = req.user.role === "employee" ? req.user.employeeId : req.body.employeeId;
    if (!empId) return sendError(res, "employeeId missing", 400);

    const emp = await Employee.findOne({ empId });
    if (!emp) return sendError(res, "Employee not found", 404);

    const advance = new Advance({
      employeeId: empId,
      employeeName: emp.name,
      amount: parseFloat(amount),
      reason,
      monthlyDeduction: parseFloat(monthlyDeduction) || 0,
      remainingAmount:  parseFloat(amount),
    });
    await advance.save();
    return sendSuccess(res, { advance }, "Advance request submitted", 201);
  } catch (err) { next(err); }
};

const getAdvances = async (req, res, next) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};
    if (req.user.role === "employee") filter.employeeId = req.user.employeeId;
    else if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    const advances = await Advance.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, { advances, total: advances.length });
  } catch (err) { next(err); }
};

const approveAdvance = async (req, res, next) => {
  try {
    const { monthlyDeduction, adminNote } = req.body;
    const advance = await Advance.findByIdAndUpdate(req.params.id, {
      status: "Approved",
      monthlyDeduction: parseFloat(monthlyDeduction) || 0,
      remainingAmount: (await Advance.findById(req.params.id))?.amount || 0,
      adminNote,
      approvedBy: "admin",
      approvedAt: new Date(),
    }, { new: true });
    if (!advance) return sendError(res, "Advance not found", 404);
    return sendSuccess(res, { advance }, "Advance approved ✅");
  } catch (err) { next(err); }
};

const rejectAdvance = async (req, res, next) => {
  try {
    const { adminNote } = req.body;
    const advance = await Advance.findByIdAndUpdate(req.params.id, { status: "Rejected", adminNote }, { new: true });
    if (!advance) return sendError(res, "Advance not found", 404);
    return sendSuccess(res, { advance }, "Advance rejected");
  } catch (err) { next(err); }
};

// Employee ka total pending advance
const getAdvanceSummary = async (req, res, next) => {
  try {
    const empId = req.params.empId || req.user.employeeId;
    const advances = await Advance.find({ employeeId: empId, status: "Approved", isFullyRecovered: false });
    const totalPending = advances.reduce((s, a) => s + a.remainingAmount, 0);
    return sendSuccess(res, { advances, totalPending });
  } catch (err) { next(err); }
};

module.exports = { requestAdvance, getAdvances, approveAdvance, rejectAdvance, getAdvanceSummary };
