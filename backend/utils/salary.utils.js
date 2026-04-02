const Attendance      = require("../models/Attendance");
const Advance         = require("../models/Advance");
const Leave           = require("../models/Leave");
const CompanySettings = require("../models/CompanySettings");

const calculateFullSalary = async (employee, month, year) => {
  const settings   = await CompanySettings.getSettings();
  const monthStr   = String(month).padStart(2, "0");
  const lastDay    = new Date(year, month, 0).getDate();
  const startDate  = `${year}-${monthStr}-01`;
  const endDate    = `${year}-${monthStr}-${lastDay}`;

  const attendanceRecords = await Attendance.find({
    employeeId: employee.empId,
    date:       { $gte: startDate, $lte: endDate },
    present:    true,
  });

  const fullDays    = attendanceRecords.filter(r => !r.isHalfDay).length;
  const halfDays    = attendanceRecords.filter(r => r.isHalfDay).length;
  const presentDays = fullDays + halfDays * 0.5;

  let basicSalary = 0;
  if (employee.salaryType === "monthly") {
    basicSalary = employee.monthlySalary || 0;
  } else {
    basicSalary = parseFloat((presentDays * (employee.dailyWage || 0)).toFixed(2));
  }

  const overtimeThreshold = settings.overtimeThresholdHours || 8;
  const perHourRate       = (employee.dailyWage || 0) / overtimeThreshold;
  const overtimeRate      = employee.overtimeRate || parseFloat((perHourRate * (settings.overtimeRateMultiplier || 1.5)).toFixed(2));
  const totalOvertimeHrs  = attendanceRecords.reduce((s, r) => s + (r.overtimeHours || 0), 0);
  const overtimeAmount    = parseFloat((totalOvertimeHrs * overtimeRate).toFixed(2));

  const incentiveAmount   = parseFloat((employee.incentive || 0).toFixed(2));

  const pendingAdvances = await Advance.find({ employeeId: employee.empId, status: "Approved", isFullyRecovered: false });
  let advanceDeduction = 0;
  for (const adv of pendingAdvances) {
    if (adv.monthlyDeduction > 0) {
      advanceDeduction += Math.min(adv.monthlyDeduction, adv.remainingAmount);
    }
  }
  advanceDeduction = parseFloat(advanceDeduction.toFixed(2));

  let leaveDeduction = 0;
  if (employee.salaryType === "monthly" && employee.monthlySalary > 0) {
    const absents = await Attendance.find({ employeeId: employee.empId, date: { $gte: startDate, $lte: endDate }, present: false });
    const approvedLeaves = await Leave.find({ employeeId: employee.empId, status: "Approved" });
    const approvedDates = new Set();
    approvedLeaves.forEach(lv => {
      let cur = new Date(lv.startDate);
      const end = new Date(lv.endDate);
      while (cur <= end) { approvedDates.add(cur.toISOString().split("T")[0]); cur.setDate(cur.getDate() + 1); }
    });
    const unauthorizedCount = absents.filter(a => !approvedDates.has(a.date)).length;
    leaveDeduction = parseFloat((unauthorizedCount * (employee.monthlySalary / lastDay)).toFixed(2));
  }

  const grossSalary     = parseFloat((basicSalary + overtimeAmount + incentiveAmount).toFixed(2));
  const totalDeductions = parseFloat((advanceDeduction + leaveDeduction).toFixed(2));
  const netSalary       = parseFloat(Math.max(0, grossSalary - totalDeductions).toFixed(2));

  return {
    empId: employee.empId, name: employee.name, salaryType: employee.salaryType,
    dailyWage: employee.dailyWage, monthlySalary: employee.monthlySalary,
    month, year, startDate, endDate,
    fullDays, halfDays, presentDays, totalOvertimeHrs,
    basicSalary, overtimeAmount, incentiveAmount, grossSalary,
    advanceDeduction, leaveDeduction, totalDeductions, netSalary,
    overtimeThreshold, overtimeRate,
  };
};

const calculateRangeSalary = async (employee, start, end) => {
  const records     = await Attendance.find({ employeeId: employee.empId, present: true, date: { $gte: start, $lte: end } });
  const fullDays    = records.filter(r => !r.isHalfDay).length;
  const halfDays    = records.filter(r => r.isHalfDay).length;
  const presentDays = fullDays + halfDays * 0.5;
  const salary      = parseFloat((presentDays * (employee.dailyWage || 0)).toFixed(2));
  return { presentDays, fullDays, halfDays, salary };
};

const processAdvanceRecovery = async (employeeId, deductedAmount) => {
  if (deductedAmount <= 0) return;
  const advances = await Advance.find({ employeeId, status: "Approved", isFullyRecovered: false }).sort({ createdAt: 1 });
  let remaining = deductedAmount;
  for (const adv of advances) {
    if (remaining <= 0) break;
    const toDeduct        = Math.min(remaining, adv.remainingAmount);
    adv.recoveredAmount  += toDeduct;
    adv.remainingAmount  -= toDeduct;
    adv.isFullyRecovered  = adv.remainingAmount <= 0;
    await adv.save();
    remaining -= toDeduct;
  }
};

module.exports = { calculateFullSalary, calculateRangeSalary, processAdvanceRecovery };
