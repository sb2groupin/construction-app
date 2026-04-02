const { createNotification } = require("./notification.controller");
const { Expense, PettyCash } = require("../models/Expense");
const { sendSuccess, sendError } = require("../utils/response.utils");

const submitExpense = async (req, res, next) => {
  try {
    const { projectId, amount, category, description } = req.body;
    if (!projectId || !amount || !category || !description)
      return sendError(res, "projectId, amount, category, description zaroori hain", 400);
    const billPhoto = req.file ? `/uploads/expenses/${req.file.filename}` : null;
    const expense = new Expense({
      projectId, amount: parseFloat(amount), category, description, billPhoto,
      submittedBy: req.user.employeeId || "admin",
    });
    await expense.save();
    return sendSuccess(res, { expense }, "Expense submitted", 201);
  } catch (err) { next(err); }
};

const getExpenses = async (req, res, next) => {
  try {
    const { projectId, status, submittedBy } = req.query;
    const filter = {};
    if (req.user.role === "employee") filter.submittedBy = req.user.employeeId;
    else {
      if (projectId)   filter.projectId   = projectId;
      if (submittedBy) filter.submittedBy = submittedBy;
    }
    if (status) filter.status = status;
    const expenses = await Expense.find(filter).sort({ createdAt: -1 });
    const total    = expenses.reduce((s, e) => s + (e.status === "Approved" ? e.amount : 0), 0);
    return sendSuccess(res, { expenses, approvedTotal: total });
  } catch (err) { next(err); }
};

const reviewExpense = async (req, res, next) => {
  try {
    const { action, adminNote } = req.body;
    const expense = await Expense.findByIdAndUpdate(req.params.id,
      { status: action, adminNote, reviewedBy: "admin", reviewedAt: new Date() }, { new: true });
    if (!expense) return sendError(res, "Expense not found", 404);
    if (action === "Approved") {
      await PettyCash.findOneAndUpdate(
        { projectId: expense.projectId },
        { $inc: { totalSpent: expense.amount, balance: -expense.amount }, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
    }
    await createNotification({ recipientId: expense.submittedBy, recipientRole: "employee", type: action === "Approved" ? "expense_approved" : "expense_rejected", title: `Expense ${action}`, message: `Aapka ₹${expense.amount} expense ${action} ho gaya`, link: "/my-expenses" });
    return sendSuccess(res, { expense }, `Expense ${action}`);
  } catch (err) { next(err); }
};

const getPettyCash = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const pc = await PettyCash.findOne(projectId ? { projectId } : {});
    return sendSuccess(res, { pettyCash: pc || { totalGiven: 0, totalSpent: 0, balance: 0 } });
  } catch (err) { next(err); }
};

const addPettyCash = async (req, res, next) => {
  try {
    const { projectId, amount } = req.body;
    if (!projectId || !amount) return sendError(res, "projectId aur amount zaroori hai", 400);
    const pc = await PettyCash.findOneAndUpdate(
      { projectId },
      { $inc: { totalGiven: parseFloat(amount), balance: parseFloat(amount) }, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    return sendSuccess(res, { pettyCash: pc }, `₹${amount} petty cash added`);
  } catch (err) { next(err); }
};

module.exports = { submitExpense, getExpenses, reviewExpense, getPettyCash, addPettyCash };
