// PDF Generation utilities using jsPDF
// Usage: import { generateSalarySlip, generateDPRReport, generateMonthlyReport } from "../../utils/pdf.utils"

const loadJsPDF = async () => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  return { jsPDF, autoTable };
};

// Adds company header to any PDF
const addHeader = (doc, settings, title, subtitle) => {
  const { companyName = "Construction Company", gstNumber, address, phone } = settings || {};
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 28, "F");
  if (settings?.logo) {
    try { doc.addImage(settings.logo, "PNG", 10, 4, 20, 20); } catch(_) {}
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont(undefined, "bold");
  doc.text(companyName, settings?.logo ? 34 : 14, 13);
  doc.setFontSize(8); doc.setFont(undefined, "normal");
  const info = [gstNumber && `GST: ${gstNumber}`, address, phone].filter(Boolean).join("  |  ");
  if (info) doc.text(info, settings?.logo ? 34 : 14, 20);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13); doc.setFont(undefined, "bold");
  doc.text(title, 14, 38);
  if (subtitle) { doc.setFontSize(9); doc.setFont(undefined, "normal"); doc.setTextColor(100, 100, 100); doc.text(subtitle, 14, 45); doc.setTextColor(0, 0, 0); }
  return 50;
};

// Salary Slip PDF
export const generateSalarySlip = async (salaryData, settings) => {
  const { jsPDF } = await loadJsPDF();
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const {
    name, empId, salaryType, month, year,
    fullDays, halfDays, presentDays,
    dailyWage, monthlySalary,
    basicSalary, overtimeAmount, incentiveAmount, grossSalary,
    advanceDeduction, leaveDeduction, totalDeductions, netSalary,
    totalOvertimeHrs,
  } = salaryData;

  const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  const { companyName = "Construction Company" } = settings || {};

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 148, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12); doc.setFont(undefined, "bold");
  doc.text(companyName, 8, 12);
  doc.setFontSize(9); doc.setFont(undefined, "normal");
  doc.text("SALARY SLIP", 148 - 8, 12, { align: "right" });
  doc.setTextColor(0, 0, 0);

  let y = 26;
  doc.setFontSize(10); doc.setFont(undefined, "bold");
  doc.text(`${name} (${empId})`, 8, y);
  doc.setFontSize(8); doc.setFont(undefined, "normal"); doc.setTextColor(100, 100, 100);
  doc.text(`Pay Period: ${monthName}  |  Type: ${salaryType === "monthly" ? "Monthly Fixed" : "Daily Wage"}`, 8, y + 5);
  doc.setTextColor(0, 0, 0);

  y += 14;
  // Earnings section
  doc.setFillColor(240, 249, 255);
  doc.rect(6, y - 4, 136, 6, "F");
  doc.setFontSize(8); doc.setFont(undefined, "bold"); doc.setTextColor(37, 99, 235);
  doc.text("EARNINGS", 8, y);
  doc.setTextColor(0, 0, 0); doc.setFont(undefined, "normal");

  const earnings = [
    ["Attendance", `${presentDays} days (${fullDays} full + ${halfDays} half)`],
    [salaryType === "monthly" ? "Monthly Salary" : `Daily Wage (₹${dailyWage} × ${presentDays})`, `Rs.${basicSalary?.toLocaleString("en-IN")}`],
    ...(overtimeAmount > 0 ? [[`Overtime (${totalOvertimeHrs}hrs)`, `Rs.${overtimeAmount?.toLocaleString("en-IN")}`]] : []),
    ...(incentiveAmount > 0 ? [["Incentive/Bonus", `Rs.${incentiveAmount?.toLocaleString("en-IN")}`]] : []),
  ];

  y += 4;
  earnings.forEach(([k, v]) => {
    doc.setFontSize(8);
    doc.text(k, 8, y + 4);
    doc.text(v, 142, y + 4, { align: "right" });
    y += 5;
  });

  doc.setFont(undefined, "bold");
  doc.text("Gross Salary", 8, y + 4);
  doc.text(`Rs.${grossSalary?.toLocaleString("en-IN")}`, 142, y + 4, { align: "right" });
  y += 8;

  if (totalDeductions > 0) {
    doc.setFillColor(255, 242, 242);
    doc.rect(6, y - 2, 136, 6, "F");
    doc.setFontSize(8); doc.setFont(undefined, "bold"); doc.setTextColor(220, 38, 38);
    doc.text("DEDUCTIONS", 8, y + 2);
    doc.setTextColor(0, 0, 0); doc.setFont(undefined, "normal");
    y += 7;
    if (advanceDeduction > 0) { doc.text("Advance Recovery", 8, y); doc.text(`-Rs.${advanceDeduction?.toLocaleString("en-IN")}`, 142, y, { align: "right" }); y += 5; }
    if (leaveDeduction > 0)   { doc.text("Leave Deduction",   8, y); doc.text(`-Rs.${leaveDeduction?.toLocaleString("en-IN")}`,   142, y, { align: "right" }); y += 5; }
  }

  y += 4;
  doc.setFillColor(240, 253, 244);
  doc.rect(6, y - 3, 136, 10, "F");
  doc.setFontSize(11); doc.setFont(undefined, "bold"); doc.setTextColor(22, 163, 74);
  doc.text("NET SALARY", 8, y + 4);
  doc.text(`Rs.${netSalary?.toLocaleString("en-IN")}`, 142, y + 4, { align: "right" });
  doc.setTextColor(0, 0, 0);

  y += 16;
  doc.setFontSize(7); doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}  |  ${settings?.pdfFooterText || "This is a computer generated salary slip."}`, 8, y);

  doc.save(`Salary_Slip_${empId}_${month}_${year}.pdf`);
};

// Monthly Report PDF
export const generateMonthlyReport = async (report, month, year, settings) => {
  const { jsPDF, autoTable } = await loadJsPDF();
  const doc = new jsPDF();
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  const startY = addHeader(doc, settings, `Monthly Salary Report`, monthName);

  autoTable(doc, {
    startY,
    head: [["Emp ID", "Name", "Days", "Basic", "OT", "Incentive", "Deductions", "Net Salary"]],
    body: report.map(r => [
      r.empId, r.name, `${r.presentDays}`,
      `Rs.${r.basicSalary?.toLocaleString("en-IN")}`,
      r.overtimeAmount > 0 ? `Rs.${r.overtimeAmount?.toLocaleString("en-IN")}` : "—",
      r.incentiveAmount > 0 ? `Rs.${r.incentiveAmount?.toLocaleString("en-IN")}` : "—",
      r.totalDeductions > 0 ? `-Rs.${r.totalDeductions?.toLocaleString("en-IN")}` : "—",
      `Rs.${r.netSalary?.toLocaleString("en-IN")}`,
    ]),
    foot: [["", "TOTAL", "", "", "", "", "", `Rs.${report.reduce((s, r) => s + r.netSalary, 0).toLocaleString("en-IN")}`]],
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 9 },
  });

  if (settings?.pdfFooterText) {
    const pageCount = doc.internal.getNumberOfPages();
    doc.setPage(pageCount);
    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text(settings.pdfFooterText, 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`Salary_Report_${month}_${year}.pdf`);
};

// DPR PDF
export const generateDPRPDF = async (dprs, projectName, month, year, settings) => {
  const { jsPDF, autoTable } = await loadJsPDF();
  const doc = new jsPDF();
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  addHeader(doc, settings, "Daily Progress Report", `${projectName}  |  ${monthName}`);

  let currentY = 55;
  for (const dpr of dprs) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    doc.setFontSize(10); doc.setFont(undefined, "bold");
    doc.text(`${dpr.date}  |  ${dpr.workCategory}  |  ${dpr.weather}`, 14, currentY);
    doc.setFont(undefined, "normal"); doc.setFontSize(9);
    doc.text(`Labour: Skilled ${dpr.skilledLabour} + Unskilled ${dpr.unskilledLabour} = ${dpr.totalLabour}`, 14, currentY + 5);
    const lines = doc.splitTextToSize(dpr.description, 180);
    doc.text(lines, 14, currentY + 10);
    currentY += 12 + (lines.length * 4);
    if (dpr.adminComment) {
      doc.setTextColor(37, 99, 235);
      doc.text(`Admin: ${dpr.adminComment}`, 14, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 5;
    }
    doc.setDrawColor(200, 200, 200);
    doc.line(14, currentY, 196, currentY);
    currentY += 5;
  }

  doc.save(`DPR_${projectName.replace(/\s/g, "_")}_${month}_${year}.pdf`);
};

// Excel export for salary
export const exportSalaryExcel = (report, month, year) => {
  const headers = ["Emp ID","Name","Days Present","Daily Wage","Basic","Overtime","Incentive","Advance Deduction","Leave Deduction","Net Salary"];
  const rows = report.map(r => [
    r.empId, r.name, r.presentDays, r.dailyWage||r.monthlySalary,
    r.basicSalary, r.overtimeAmount||0, r.incentiveAmount||0,
    r.advanceDeduction||0, r.leaveDeduction||0, r.netSalary,
  ]);
  const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `Salary_Report_${month}_${year}.csv`; a.click();
  URL.revokeObjectURL(url);
};

// Excel export for attendance
export const exportAttendanceExcel = (records, employeeName, month, year) => {
  const headers = ["Date","Status","Half Day","Check In","Check Out","Working Hours","Location Valid","Overtime Hours"];
  const rows = records.map(r => [
    r.date,
    r.present ? "Present" : "Absent",
    r.isHalfDay ? "Yes" : "No",
    r.checkInTime  ? new Date(r.checkInTime).toLocaleTimeString("en-IN")  : "",
    r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("en-IN") : "",
    r.workingHours || "",
    r.location?.isValid !== false ? "Yes" : "No",
    r.overtimeHours || 0,
  ]);
  const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `Attendance_${employeeName}_${month}_${year}.csv`; a.click();
  URL.revokeObjectURL(url);
};
