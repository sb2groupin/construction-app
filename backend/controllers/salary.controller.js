const Employee = require("../models/Employee");
const { calculateFullSalary, calculateRangeSalary, processAdvanceRecovery } = require("../utils/salary.utils");
const { sendSuccess, sendError } = require("../utils/response.utils");

const getMonthlySalary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return sendError(res, "month aur year zaroori hain", 400);
    const emp = await Employee.findOne({ empId: req.params.id });
    if (!emp) return sendError(res, "Employee not found", 404);
    const result = await calculateFullSalary(emp, parseInt(month), parseInt(year));
    return sendSuccess(res, result);
  } catch (err) { next(err); }
};

const getRangeSalary = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return sendError(res, "start aur end zaroori hain", 400);
    const emp = await Employee.findOne({ empId: req.params.id });
    if (!emp) return sendError(res, "Employee not found", 404);
    const result = await calculateRangeSalary(emp, start, end);
    return sendSuccess(res, { empId: emp.empId, name: emp.name, start, end, ...result });
  } catch (err) { next(err); }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const { month, year, projectId } = req.query;
    if (!month || !year) return sendError(res, "month aur year zaroori hain", 400);
    const filter = { isActive: true };
    if (projectId) filter.projectId = projectId;
    const employees = await Employee.find(filter);
    const report = await Promise.all(employees.map(emp => calculateFullSalary(emp, parseInt(month), parseInt(year))));
    const totalGross = report.reduce((s, r) => s + r.grossSalary, 0);
    const totalNet   = report.reduce((s, r) => s + r.netSalary, 0);
    return sendSuccess(res, { month, year, report, totalGross, totalNet });
  } catch (err) { next(err); }
};

// Mark salary as paid and process advance recovery
const markSalaryPaid = async (req, res, next) => {
  try {
    const { employeeId, month, year, advanceDeduction } = req.body;
    if (advanceDeduction > 0) await processAdvanceRecovery(employeeId, parseFloat(advanceDeduction));
    return sendSuccess(res, {}, "Salary marked as paid, advance recovery processed");
  } catch (err) { next(err); }
};

module.exports = { getMonthlySalary, getRangeSalary, getMonthlyReport, markSalaryPaid };
