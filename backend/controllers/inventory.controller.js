const { Inventory, Transaction, MaterialRequest } = require("../models/Inventory");
const { sendSuccess, sendError } = require("../utils/response.utils");

// ── Inventory CRUD ────────────────────────────────────
const getInventory = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const filter = projectId ? { projectId } : {};
    const items = await Inventory.find(filter).sort({ materialName: 1 });
    const lowStock = items.filter(i => i.currentStock <= i.lowStockThreshold);
    return sendSuccess(res, { items, lowStockAlerts: lowStock.length, lowStock });
  } catch (err) { next(err); }
};

const addMaterial = async (req, res, next) => {
  try {
    const { projectId, materialName, unit, lowStockThreshold, vendorName, unitPrice } = req.body;
    if (!projectId || !materialName || !unit)
      return sendError(res, "projectId, materialName, unit zaroori hain", 400);
    const item = new Inventory({ projectId, materialName, unit, lowStockThreshold: lowStockThreshold || 50, vendorName, unitPrice: unitPrice || 0 });
    await item.save();
    return sendSuccess(res, { item }, "Material added", 201);
  } catch (err) { next(err); }
};

// ── Stock Entry ───────────────────────────────────────
const receiveStock = async (req, res, next) => {
  try {
    const { inventoryId, quantity, notes } = req.body;
    if (!inventoryId || !quantity) return sendError(res, "inventoryId aur quantity zaroori hai", 400);
    const item = await Inventory.findById(inventoryId);
    if (!item) return sendError(res, "Material not found", 404);
    const billPhoto = req.file ? `/uploads/expenses/${req.file.filename}` : null;
    item.currentStock += parseFloat(quantity);
    item.totalValue = item.currentStock * item.unitPrice;
    await item.save();
    await Transaction.create({ inventoryId, projectId: item.projectId, type: "received", quantity: parseFloat(quantity), billPhoto, notes, recordedBy: req.user.employeeId || "admin" });
    return sendSuccess(res, { item }, `Stock updated — ${item.currentStock} ${item.unit} baaki`);
  } catch (err) { next(err); }
};

const useStock = async (req, res, next) => {
  try {
    const { inventoryId, quantity, notes } = req.body;
    const item = await Inventory.findById(inventoryId);
    if (!item) return sendError(res, "Material not found", 404);
    if (item.currentStock < quantity) return sendError(res, `Stock kam hai — sirf ${item.currentStock} ${item.unit} available`, 400);
    item.currentStock -= parseFloat(quantity);
    item.totalValue = item.currentStock * item.unitPrice;
    await item.save();
    await Transaction.create({ inventoryId, projectId: item.projectId, type: "used", quantity: parseFloat(quantity), notes, recordedBy: req.user.employeeId || "admin" });
    const isLow = item.currentStock <= item.lowStockThreshold;
    return sendSuccess(res, { item, lowStockAlert: isLow }, isLow ? `⚠️ Low stock alert! ${item.currentStock} ${item.unit} baaki` : "Stock updated");
  } catch (err) { next(err); }
};

const getTransactions = async (req, res, next) => {
  try {
    const { inventoryId, projectId } = req.query;
    const filter = {};
    if (inventoryId) filter.inventoryId = inventoryId;
    if (projectId)   filter.projectId   = projectId;
    const txns = await Transaction.find(filter).sort({ createdAt: -1 }).limit(100);
    return sendSuccess(res, { transactions: txns });
  } catch (err) { next(err); }
};

// ── Material Requests ─────────────────────────────────
const createRequest = async (req, res, next) => {
  try {
    const { projectId, materialName, quantity, unit, reason } = req.body;
    if (!projectId || !materialName || !quantity || !unit)
      return sendError(res, "projectId, materialName, quantity, unit zaroori hain", 400);
    const req_ = new MaterialRequest({ projectId, materialName, quantity, unit, reason, requestedBy: req.user.employeeId || "admin" });
    await req_.save();
    return sendSuccess(res, { request: req_ }, "Request submitted", 201);
  } catch (err) { next(err); }
};

const getRequests = async (req, res, next) => {
  try {
    const { projectId, status } = req.query;
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (status)    filter.status    = status;
    const requests = await MaterialRequest.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, { requests, total: requests.length });
  } catch (err) { next(err); }
};

const reviewRequest = async (req, res, next) => {
  try {
    const { action, adminNote } = req.body; // action: "Approved" | "Rejected"
    const request = await MaterialRequest.findByIdAndUpdate(req.params.id,
      { status: action, adminNote, reviewedBy: "admin" }, { new: true });
    if (!request) return sendError(res, "Request not found", 404);
    return sendSuccess(res, { request }, `Request ${action}`);
  } catch (err) { next(err); }
};

module.exports = { getInventory, addMaterial, receiveStock, useStock, getTransactions, createRequest, getRequests, reviewRequest };
