const { Incident, Notice } = require("../models/Notice");
const { sendSuccess, sendError } = require("../utils/response.utils");

// ── Incidents ─────────────────────────────────────────
const reportIncident = async (req, res, next) => {
  try {
    const { projectId, incidentType, description, severity } = req.body;
    if (!projectId || !incidentType || !description)
      return sendError(res, "projectId, incidentType, description zaroori hain", 400);
    const photo = req.file ? `/uploads/dpr/${req.file.filename}` : null;
    const incident = new Incident({
      projectId, incidentType, description,
      severity: severity || "Medium",
      photo,
      reportedBy: req.user.employeeId || "admin",
    });
    await incident.save();
    return sendSuccess(res, { incident }, "Incident reported", 201);
  } catch (err) { next(err); }
};

const getIncidents = async (req, res, next) => {
  try {
    const { projectId, severity, status } = req.query;
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (severity)  filter.severity  = severity;
    if (status)    filter.status    = status;
    const incidents = await Incident.find(filter).populate("projectId", "name").sort({ createdAt: -1 });
    return sendSuccess(res, { incidents, total: incidents.length });
  } catch (err) { next(err); }
};

const updateIncident = async (req, res, next) => {
  try {
    const { adminNote, status } = req.body;
    const incident = await Incident.findByIdAndUpdate(req.params.id, { adminNote, status }, { new: true });
    if (!incident) return sendError(res, "Incident not found", 404);
    return sendSuccess(res, { incident }, "Incident updated");
  } catch (err) { next(err); }
};

// ── Notices ───────────────────────────────────────────
const createNotice = async (req, res, next) => {
  try {
    const { title, message, targetAll, projectIds } = req.body;
    if (!title || !message) return sendError(res, "title aur message zaroori hain", 400);
    const notice = new Notice({ title, message, targetAll: targetAll !== false, projectIds: projectIds || [], createdBy: "admin" });
    await notice.save();
    return sendSuccess(res, { notice }, "Notice posted", 201);
  } catch (err) { next(err); }
};

const getNotices = async (req, res, next) => {
  try {
    const notices = await Notice.find({ isActive: true }).sort({ createdAt: -1 }).limit(20);
    return sendSuccess(res, { notices });
  } catch (err) { next(err); }
};

const deleteNotice = async (req, res, next) => {
  try {
    await Notice.findByIdAndUpdate(req.params.id, { isActive: false });
    return sendSuccess(res, {}, "Notice removed");
  } catch (err) { next(err); }
};

module.exports = { reportIncident, getIncidents, updateIncident, createNotice, getNotices, deleteNotice };
