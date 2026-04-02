const Employee = require("../models/Employee");
const { sendSuccess, sendError } = require("../utils/response.utils");

const generateEmpId = async () => {
  const last = await Employee.findOne().sort({ createdAt: -1 }).select("empId");
  if (!last || !last.empId) return "EMP001";

  const num = parseInt(last.empId.replace("EMP", ""), 10) + 1;
  return "EMP" + String(num).padStart(3, "0");
};

const pickDefinedFields = (source, fields) => {
  const updates = {};

  fields.forEach((field) => {
    if (source[field] !== undefined) {
      updates[field] = source[field];
    }
  });

  return updates;
};

const addEmployee = async (req, res, next) => {
  try {
    const { name, phone, dailyWage, designation, address, emergencyContact, email } = req.body;

    if (!name || !dailyWage) {
      return sendError(res, "Name aur dailyWage zaroori hain", 400);
    }

    const empId = await generateEmpId();

    const employee = new Employee({
      empId,
      name,
      phone,
      email,
      dailyWage,
      designation,
      address,
      emergencyContact,
    });

    await employee.save();
    return sendSuccess(res, { employee }, "Employee added successfully", 201);
  } catch (err) {
    next(err);
  }
};

const getAllEmployees = async (req, res, next) => {
  try {
    const { projectId, isActive } = req.query;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const employees = await Employee.find(filter).populate("projectId", "name location");
    return sendSuccess(res, { employees, total: employees.length });
  } catch (err) {
    next(err);
  }
};

const getEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findOne({ empId: req.params.id }).populate("projectId", "name");
    if (!emp) return sendError(res, "Employee not found", 404);

    return sendSuccess(res, { employee: emp });
  } catch (err) {
    next(err);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const adminFields = [
      "name",
      "phone",
      "alternatePhone",
      "email",
      "dailyWage",
      "monthlySalary",
      "salaryType",
      "overtimeRate",
      "incentive",
      "designation",
      "projectId",
      "address",
      "emergencyContact",
      "dateOfBirth",
      "gender",
      "bloodGroup",
      "maritalStatus",
      "joinDate",
      "photo",
      "aadharPhoto",
      "panPhoto",
      "isActive",
    ];

    const employeeFields = [
      "name",
      "phone",
      "alternatePhone",
      "email",
      "address",
      "emergencyContact",
      "dateOfBirth",
      "gender",
      "bloodGroup",
      "maritalStatus",
      "photo",
      "aadharPhoto",
      "panPhoto",
    ];

    const fields = req.user?.role === "admin" ? adminFields : employeeFields;
    const updates = pickDefinedFields(req.body, fields);

    if (Object.keys(updates).length === 0) {
      return sendError(res, "No valid fields provided for update", 400);
    }

    const updated = await Employee.findOneAndUpdate(
      { empId: req.params.id },
      updates,
      { new: true, runValidators: true }
    ).populate("projectId", "name");

    if (!updated) return sendError(res, "Employee not found", 404);
    return sendSuccess(res, { employee: updated }, "Employee updated");
  } catch (err) {
    next(err);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findOneAndUpdate(
      { empId: req.params.id },
      { isActive: false },
      { new: true }
    );

    if (!emp) return sendError(res, "Employee not found", 404);
    return sendSuccess(res, {}, "Employee deactivated");
  } catch (err) {
    next(err);
  }
};

module.exports = { addEmployee, getAllEmployees, getEmployee, updateEmployee, deleteEmployee };
