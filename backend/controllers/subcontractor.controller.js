const Subcontractor = require("../models/Subcontractor");
const { sendSuccess, sendError } = require("../utils/response.utils");

const getAll = async (req, res, next) => {
  try {
    const { projectId, status } = req.query;
    const filter = { isActive: true };
    if (projectId) filter.projectId = projectId;
    if (status)    filter.status    = status;
    const list = await Subcontractor.find(filter).populate("projectId", "name").sort({ createdAt: -1 });
    return sendSuccess(res, { subcontractors: list, total: list.length });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, trade, phone, company, email, address, projectId, workScope, contractAmount, startDate, endDate } = req.body;
    if (!name) return sendError(res, "Name zaroori hai", 400);
    const sub = new Subcontractor({ name, trade, phone, company, email, address, projectId, workScope, contractAmount: parseFloat(contractAmount) || 0, startDate, endDate, balanceDue: parseFloat(contractAmount) || 0 });
    await sub.save();
    return sendSuccess(res, { subcontractor: sub }, "Subcontractor added ✅", 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const sub = await Subcontractor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sub) return sendError(res, "Not found", 404);
    return sendSuccess(res, { subcontractor: sub }, "Updated");
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await Subcontractor.findByIdAndUpdate(req.params.id, { isActive: false });
    return sendSuccess(res, {}, "Removed");
  } catch (err) { next(err); }
};

// Add payment entry
const addPayment = async (req, res, next) => {
  try {
    const { amount, date, note } = req.body;
    if (!amount) return sendError(res, "Amount zaroori hai", 400);
    const sub = await Subcontractor.findById(req.params.id);
    if (!sub) return sendError(res, "Not found", 404);
    sub.payments.push({ amount: parseFloat(amount), date, note });
    sub.totalPaid    += parseFloat(amount);
    sub.balanceDue    = Math.max(0, sub.contractAmount - sub.totalPaid);
    if (sub.balanceDue === 0) sub.status = "Completed";
    await sub.save();
    return sendSuccess(res, { subcontractor: sub }, `Payment of ₹${amount} recorded`);
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove, addPayment };
