import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { salaryAPI } from "../../api/salary.api";
import { employeeAPI } from "../../api/employee.api";
import { attendanceAPI } from "../../api/attendance.api";
import { settingsAPI } from "../../api/settings.api";
import { generateMonthlyReport, exportSalaryExcel, exportAttendanceExcel } from "../../utils/pdf.utils";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

const Reports = () => {
  const { t } = useTranslation();
  const [tab,       setTab]      = useState("salary");
  const [report,    setReport]   = useState([]);
  const [employees, setEmployees]= useState([]);
  const [attRecords,setAttRecords]= useState([]);
  const [settings,  setSettings] = useState(null);
  const [loading,   setLoading]  = useState(false);
  const [selEmp,    setSelEmp]   = useState("");
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(thisMonth);

  useEffect(() => {
    Promise.all([employeeAPI.getAll({ isActive: true }), settingsAPI.get()])
      .then(([empRes, sRes]) => {
        const emps = empRes.data.employees || [];
        setEmployees(emps);
        if (emps.length) setSelEmp(emps[0].empId);
        setSettings(sRes.data.settings);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "salary") loadSalaryReport();
    if (tab === "attendance" && selEmp) loadAttendance();
  }, [month, tab, selEmp]);

  const loadSalaryReport = async () => {
    const [year, m] = month.split("-");
    setLoading(true);
    try { const res = await salaryAPI.getMonthlyReport({ month: m, year }); setReport(res.data.report || []); }
    catch { toast.error(t("loadError")); }
    finally { setLoading(false); }
  };

  const loadAttendance = async () => {
    const [year, m] = month.split("-");
    setLoading(true);
    try { const res = await attendanceAPI.getAll({ employeeId: selEmp, month: m, year }); setAttRecords(res.data.attendance || []); }
    catch {}
    finally { setLoading(false); }
  };

  const handlePDFExport = async () => {
    if (!report.length) { toast.error("Pehle report load karo"); return; }
    const [year, m] = month.split("-");
    try {
      await generateMonthlyReport(report, parseInt(m), parseInt(year), settings);
      toast.success("PDF downloaded ✅");
    } catch (err) { toast.error("PDF failed: " + err.message); }
  };

  const handleExcelExport = () => {
    if (!report.length) { toast.error("Pehle report load karo"); return; }
    const [year, m] = month.split("-");
    exportSalaryExcel(report, m, year);
    toast.success("Excel (CSV) downloaded ✅");
  };

  const handleAttExcel = () => {
    if (!attRecords.length) { toast.error("Koi records nahi"); return; }
    const [year, m] = month.split("-");
    const emp = employees.find(e => e.empId === selEmp);
    exportAttendanceExcel(attRecords, emp?.name || selEmp, m, year);
    toast.success("Attendance exported ✅");
  };

  const totalNet   = report.reduce((s, r) => s + r.netSalary, 0);
  const totalGross = report.reduce((s, r) => s + r.grossSalary, 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">{t("reportsExportsTitle")}</h1></div>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {[["salary",t("salaryTab")],["attendance",t("attendanceTab")]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} className="btn btn-sm"
              style={{ background:tab===id?"var(--primary)":"var(--gray-100)", color:tab===id?"white":"var(--gray-600)", border:"none" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Salary Report */}
      {tab === "salary" && (
        <>
          <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"14px", flexWrap:"wrap" }}>
            <input type="month" className="form-control" style={{ width:"auto" }} value={month} onChange={e => setMonth(e.target.value)} />
            <button className="btn btn-danger" onClick={handlePDFExport} disabled={!report.length}>{t("pdfExportButton")}</button>
            <button className="btn btn-success" onClick={handleExcelExport} disabled={!report.length}>{t("excelExportButton")}</button>
          </div>

          {/* Summary */}
          {report.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"16px" }}>
              {[
                { label:t("totalEmployees"), value:report.length, color:"var(--primary)" },
                { label:t("grossPayable"),   value:`₹${totalGross.toLocaleString("en-IN")}`, color:"var(--warning)" },
                { label:t("netPayable"),     value:`₹${totalNet.toLocaleString("en-IN")}`,   color:"var(--success)" },
              ].map(s=>(
                <div key={s.label} className="card" style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"18px", fontWeight:700, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:"12px", color:"var(--gray-400)", marginTop:"4px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            {loading ? <Loader fullPage={false} /> : report.length === 0 ? (
              <div className="empty-state"><span style={{ fontSize:"36px" }}>💰</span><p>{t("noDataThisMonth")}</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>{t("empIdHeader")}</th><th>{t("nameHeader")}</th><th>{t("daysHeader")}</th><th>{t("basicHeader")}</th><th>{t("otHeader")}</th><th>{t("incentiveHeader")}</th><th>{t("deductionsHeader")}</th><th>{t("netSalaryHeader")}</th></tr></thead>
                  <tbody>
                    {report.map(r => (
                      <tr key={r.empId}>
                        <td style={{ fontFamily:"monospace", fontWeight:500 }}>{r.empId}</td>
                        <td style={{ fontWeight:500 }}>{r.name}</td>
                        <td>{r.presentDays}<span style={{ fontSize:"11px", color:"var(--gray-400)" }}> ({r.fullDays}+{r.halfDays}×½)</span></td>
                        <td>₹{r.basicSalary?.toLocaleString("en-IN")}</td>
                        <td>{r.overtimeAmount>0?<span style={{ color:"var(--primary)" }}>₹{r.overtimeAmount?.toLocaleString("en-IN")}</span>:"—"}</td>
                        <td>{r.incentiveAmount>0?<span style={{ color:"var(--primary)" }}>₹{r.incentiveAmount?.toLocaleString("en-IN")}</span>:"—"}</td>
                        <td>{r.totalDeductions>0?<span style={{ color:"var(--danger)" }}>-₹{r.totalDeductions?.toLocaleString("en-IN")}</span>:"—"}</td>
                        <td style={{ fontWeight:700, color:"var(--success)" }}>₹{r.netSalary?.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:"var(--gray-50)", fontWeight:700 }}>
                      <td colSpan={7} style={{ padding:"12px 14px" }}>{t("netPayableTotal")}</td>
                      <td style={{ padding:"12px 14px", color:"var(--success)", fontSize:"16px" }}>₹{totalNet.toLocaleString("en-IN")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Attendance Report */}
      {tab === "attendance" && (
        <>
          <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"14px", flexWrap:"wrap" }}>
            <select className="form-control" style={{ width:"auto" }} value={selEmp} onChange={e=>setSelEmp(e.target.value)}>
              {employees.map(e=><option key={e.empId} value={e.empId}>{e.empId} — {e.name}</option>)}
            </select>
            <input type="month" className="form-control" style={{ width:"auto" }} value={month} onChange={e=>setMonth(e.target.value)} />
            <button className="btn btn-success" onClick={handleAttExcel} disabled={!attRecords.length}>{t("excelExportButton")}</button>
          </div>

          <div className="card">
            {loading ? <Loader fullPage={false} /> : attRecords.length === 0 ? (
              <div className="empty-state"><span style={{ fontSize:"36px" }}>📅</span><p>{t("noAttendanceRecords")}</p></div>
            ) : (
              <>
                <div style={{ display:"flex", gap:"10px", marginBottom:"12px", fontSize:"13px" }}>
                  <span style={{ padding:"4px 12px", background:"#f0fdf4", color:"#16a34a", borderRadius:"8px" }}>✅ {t("presentBadge")}: {attRecords.filter(r=>r.present&&!r.isHalfDay).length}</span>
                  <span style={{ padding:"4px 12px", background:"#fffbeb", color:"#d97706", borderRadius:"8px" }}>🌗 {t("halfDayBadge")}: {attRecords.filter(r=>r.isHalfDay).length}</span>
                  <span style={{ padding:"4px 12px", background:"#fef2f2", color:"#dc2626", borderRadius:"8px" }}>❌ {t("absentBadge")}: {attRecords.filter(r=>!r.present).length}</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>{t("dateHeader")}</th><th>{t("statusHeader")}</th><th>{t("checkInHeader")}</th><th>{t("checkOutHeader")}</th><th>{t("hoursHeader")}</th><th>{t("otHoursHeader")}</th><th>{t("locationHeader")}</th></tr></thead>
                    <tbody>
                      {attRecords.map(r=>(
                        <tr key={r._id}>
                          <td>{r.date}</td>
                          <td>{r.present?(r.isHalfDay?<span style={{ color:"#d97706" }}>🌗 {t("halfDayBadge")}</span>:<span style={{ color:"#16a34a" }}>✅ {t("presentBadge")}</span>):<span style={{ color:"#dc2626" }}>❌ {t("absentBadge")}</span>}</td>
                          <td style={{ fontSize:"12px" }}>{r.checkInTime?new Date(r.checkInTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"—"}</td>
                          <td style={{ fontSize:"12px" }}>{r.checkOutTime?new Date(r.checkOutTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"—"}</td>
                          <td>{r.workingHours?`${r.workingHours}h`:"—"}</td>
                          <td>{r.overtimeHours>0?<span style={{ color:"var(--primary)" }}>{r.overtimeHours}h</span>:"—"}</td>
                          <td>{r.location?.latitude?(r.location.isValid?<span style={{ color:"var(--success)" }}>✅</span>:<span style={{ color:"var(--danger)" }}>⚠️{r.location.distanceFromSite}m</span>):"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
