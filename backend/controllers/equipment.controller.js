const Equipment = require("../models/Equipment");
const { sendSuccess, sendError } = require("../utils/response.utils");

const getAll = async (req, res, next) => {
  try {
    const { projectId, status } = req.query;
    const filter = { isActive: true };
    if (projectId) filter.projectId = projectId;
    if (status)    filter.status    = status;
    const list = await Equipment.find(filter).populate("projectId", "name").sort({ name: 1 });
    // Maintenance due alert
    const today = new Date().toISOString().split("T")[0];
    const overdueService = list.filter(e => e.nextServiceDate && e.nextServiceDate <= today && e.status !== "Under Maintenance");
    return sendSuccess(res, { equipment: list, total: list.length, overdueServiceCount: overdueService.length });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, type, registrationNo, projectId, lastServiceDate, nextServiceDate } = req.body;
    if (!name) return sendError(res, "Equipment name zaroori hai", 400);
    const eq = new Equipment({ name, type, registrationNo, projectId, lastServiceDate, nextServiceDate });
    await eq.save();
    return sendSuccess(res, { equipment: eq }, "Equipment added ✅", 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const eq = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!eq) return sendError(res, "Not found", 404);
    return sendSuccess(res, { equipment: eq }, "Updated");
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await Equipment.findByIdAndUpdate(req.params.id, { isActive: false });
    return sendSuccess(res, {}, "Removed");
  } catch (err) { next(err); }
};

// Add daily usage log
const addUsage = async (req, res, next) => {
  try {
    const { date, hoursUsed, operatorName, fuelCost, notes } = req.body;
    if (!date || !hoursUsed) return sendError(res, "date aur hoursUsed zaroori hain", 400);
    const eq = await Equipment.findById(req.params.id);
    if (!eq) return sendError(res, "Not found", 404);
    eq.usageLogs.push({ date, hoursUsed: parseFloat(hoursUsed), operatorName, fuelCost: parseFloat(fuelCost) || 0, notes });
    eq.totalHours    += parseFloat(hoursUsed);
    eq.totalFuelCost += parseFloat(fuelCost) || 0;
    await eq.save();
    return sendSuccess(res, { equipment: eq }, "Usage logged");
  } catch (err) { next(err); }
};

// Mark service done
const markServiceDone = async (req, res, next) => {
  try {
    const { nextServiceDate, notes } = req.body;
    const today = new Date().toISOString().split("T")[0];
    const eq = await Equipment.findByIdAndUpdate(req.params.id,
      { lastServiceDate: today, nextServiceDate: nextServiceDate || null, maintenanceNotes: notes, status: "Active" },
      { new: true }
    );
    if (!eq) return sendError(res, "Not found", 404);
    return sendSuccess(res, { equipment: eq }, "Service recorded ✅");
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove, addUsage, markServiceDone };
