const { createNotification } = require("./notification.controller");
const Task = require("../models/Task");
const { sendSuccess, sendError } = require("../utils/response.utils");

const createTask = async (req, res, next) => {
  try {
    const { projectId, assignedTo, title, description, priority, dueDate, isRecurring, recurringType } = req.body;
    if (!assignedTo || !title) return sendError(res, "assignedTo aur title zaroori hain", 400);
    const task = new Task({ projectId, assignedTo, title, description, priority, dueDate, isRecurring, recurringType, assignedBy: "admin" });
    await task.save();
    await createNotification({ recipientId: assignedTo, recipientRole: "employee", type: "task_assigned", title: "Naya Task Assign ✅", message: `"${title}" task aapko assign hua hai. Priority: ${priority || "Medium"}`, link: "/my-tasks" });
    return sendSuccess(res, { task }, "Task created", 201);
  } catch (err) { next(err); }
};

const getTasks = async (req, res, next) => {
  try {
    const { projectId, assignedTo, status } = req.query;
    const filter = {};
    if (req.user.role === "employee") filter.assignedTo = req.user.employeeId;
    else {
      if (projectId)  filter.projectId  = projectId;
      if (assignedTo) filter.assignedTo = assignedTo;
    }
    if (status) filter.status = status;
    const tasks = await Task.find(filter).sort({ priority: 1, dueDate: 1 });

    // Overdue flag karo
    const today = new Date().toISOString().split("T")[0];
    const withFlags = tasks.map(t => ({
      ...t.toObject(),
      isOverdue: t.dueDate && t.dueDate < today && t.status !== "Completed",
    }));
    return sendSuccess(res, { tasks: withFlags, total: tasks.length });
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const { status, title, description, priority, dueDate } = req.body;
    const updates = {};
    if (title)       updates.title       = title;
    if (description) updates.description = description;
    if (priority)    updates.priority    = priority;
    if (dueDate)     updates.dueDate     = dueDate;
    if (status) {
      updates.status = status;
      if (status === "Completed") {
        updates.completedAt = new Date();
        if (req.file) updates.completionPhoto = `/uploads/dpr/${req.file.filename}`;
      }
    }
    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!task) return sendError(res, "Task not found", 404);
    return sendSuccess(res, { task }, "Task updated");
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    return sendSuccess(res, {}, "Task deleted");
  } catch (err) { next(err); }
};

const getOverdueTasks = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const tasks = await Task.find({ dueDate: { $lt: today }, status: { $ne: "Completed" } });
    return sendSuccess(res, { tasks, total: tasks.length });
  } catch (err) { next(err); }
};

module.exports = { createTask, getTasks, updateTask, deleteTask, getOverdueTasks };
