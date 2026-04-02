const Project  = require("../models/Project");
const Employee = require("../models/Employee");
const { sendSuccess, sendError } = require("../utils/response.utils");

// Sab projects
const getAllProjects = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const projects = await Project.find(filter).sort({ createdAt: -1 });

    // Har project ke saath employee count attach karo
    const projectsWithCount = await Promise.all(
      projects.map(async (p) => {
        const empCount = await Employee.countDocuments({
          projectId: p._id,
          isActive: true,
        });
        return { ...p.toObject(), employeeCount: empCount };
      })
    );

    return sendSuccess(res, { projects: projectsWithCount, total: projects.length });
  } catch (err) {
    next(err);
  }
};

// Single project
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return sendError(res, "Project not found", 404);

    const employees = await Employee.find({
      projectId: req.params.id,
      isActive: true,
    }).select("empId name designation phone");

    return sendSuccess(res, { project, employees });
  } catch (err) {
    next(err);
  }
};

// Add project
const addProject = async (req, res, next) => {
  try {
    const {
      name, location, googleMapLink, clientName, clientPhone,
      budget, startDate, deadline, status, supervisorId,
      description, siteLatitude, siteLongitude, geoFenceRadius,
    } = req.body;

    if (!name || !location) {
      return sendError(res, "Project name aur location zaroori hain", 400);
    }

    const project = new Project({
      name, location, googleMapLink, clientName, clientPhone,
      budget, startDate, deadline, status, supervisorId,
      description, siteLatitude, siteLongitude, geoFenceRadius,
    });

    await project.save();
    return sendSuccess(res, { project }, "Project added successfully", 201);
  } catch (err) {
    next(err);
  }
};

// Update project
const updateProject = async (req, res, next) => {
  try {
    const allowed = [
      "name", "location", "googleMapLink", "clientName", "clientPhone",
      "budget", "amountSpent", "startDate", "deadline", "status",
      "completionPercent", "supervisorId", "description",
      "siteLatitude", "siteLongitude", "geoFenceRadius",
    ];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const project = await Project.findByIdAndUpdate(
      req.params.id, updates, { new: true, runValidators: true }
    );

    if (!project) return sendError(res, "Project not found", 404);
    return sendSuccess(res, { project }, "Project updated");
  } catch (err) {
    next(err);
  }
};

// Delete project
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return sendError(res, "Project not found", 404);

    // Is project se linked employees ko unlink karo
    await Employee.updateMany({ projectId: req.params.id }, { projectId: null });

    return sendSuccess(res, {}, "Project deleted");
  } catch (err) {
    next(err);
  }
};

// Employee ko project pe assign / unassign karo
const assignEmployee = async (req, res, next) => {
  try {
    const { empId, action } = req.body; // action: "assign" | "unassign"

    const emp = await Employee.findOne({ empId });
    if (!emp) return sendError(res, "Employee not found", 404);

    if (action === "assign") {
      const project = await Project.findById(req.params.id);
      if (!project) return sendError(res, "Project not found", 404);
      emp.projectId = req.params.id;
      await emp.save();
      return sendSuccess(res, {}, `${empId} assigned to ${project.name}`);
    } else {
      emp.projectId = null;
      await emp.save();
      return sendSuccess(res, {}, `${empId} unassigned`);
    }
  } catch (err) {
    next(err);
  }
};

// Dashboard summary — sab sites ka overview
const getProjectsSummary = async (req, res, next) => {
  try {
    const total     = await Project.countDocuments();
    const active    = await Project.countDocuments({ status: "Active" });
    const completed = await Project.countDocuments({ status: "Completed" });
    const onHold    = await Project.countDocuments({ status: "On Hold" });

    return sendSuccess(res, { total, active, completed, onHold });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllProjects, getProject, addProject,
  updateProject, deleteProject, assignEmployee, getProjectsSummary,
};
