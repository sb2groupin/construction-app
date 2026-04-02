import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { employeeAPI } from "../../api/employee.api";
import { salaryAPI } from "../../api/salary.api";
import Loader from "../../components/common/Loader";
import Badge from "../../components/common/Badge";
import toast from "react-hot-toast";

const SalaryBreakdown = ({ r, t }) => {
  if (!r) return null;
  const rows = [
    [t("salaryType"),    r.salaryType === "monthly" ? t("monthlyFixed") : t("dailyWage")],
    r.salaryType === "daily"
      ? [t("dailyWage"),   `₹${r.dailyWage}`]
      : [t("monthlySalary"), `₹${r.monthlySalary?.toLocaleString("en-IN")}`],
    [t("presentDays"),   `${r.presentDays} (${r.fullDays} ${t("full")} + ${r.halfDays} ${t("half")})`],
    [t("basicSalary"),   `₹${r.basicSalary?.toLocaleString("en-IN")}`],
    ...(r.overtimeAmount > 0 ? [[t("overtime"), `${r.totalOvertimeHrs}hrs × ₹${r.overtimeRate} = ₹${r.overtimeAmount.toLocaleString("en-IN")}`]] : []),
    ...(r.incentiveAmount > 0 ? [[t("incentive"), `₹${r.incentiveAmount.toLocaleString("en-IN")}`]] : []),
  ];
  const deductions = [
    ...(r.advanceDeduction > 0 ? [[t("advanceDeduction"), `-₹${r.advanceDeduction.toLocaleString("en-IN")}`]] : []),
    ...(r.leaveDeduction > 0   ? [[t("leaveDeduction"),   `-₹${r.leaveDeduction.toLocaleString("en-IN")}`]]   : []),
  ];

  return (
    <div className="card" style={{ maxWidth: "520px" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">{t("salarySlip")}</h3>
          <p style={{ fontSize: "12px", color: "var(--gray-400)", marginTop: "2px" }}>{r.name} · {r.empId} · {r.month}/{r.year}</p>
        </div>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "6px" }}>{t("earningsDeductions")}</div>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--gray-100)", fontSize: "14px" }}>
            <span style={{ color: "var(--gray-600)" }}>{k}</span>
            <span style={{ fontWeight: 500 }}>{v}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "14px", fontWeight: 600 }}>
          <span>{t("grossSalary")}</span>
          <span>₹{r.grossSalary?.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {deductions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "6px" }}>{t("deductions")}</div>
          {deductions.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--gray-100)", fontSize: "14px" }}>
              <span style={{ color: "var(--gray-600)" }}>{k}</span>
              <span style={{ fontWeight: 500, color: "var(--danger)" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "14px", fontWeight: 600, color: "var(--danger)" }}>
            <span>{t("totalDeductions")}</span>
            <span>-₹{r.totalDeductions?.toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0", fontSize: "20px", fontWeight: 700, borderTop: "2px solid var(--gray-200)" }}>
        <span>{t("netSalary")}</span>
        <span style={{ color: "var(--success)" }}>₹{r.netSalary?.toLocaleString("en-IN")}</span>
      </div>
      <div style={{ display:"flex", gap:"10px", marginTop:"16px" }}>
        <button className="btn btn-danger" style={{ flex:1 }} onClick={async()=>{try{await generateSalarySlip(r);toast.success(t("downloadPDF"));}catch(e){toast.error(t("downloadError")+": "+e.message);}}}>
          📄 {t("downloadSalarySlip")}
        </button>
      </div>
    </div>
  );
};

const Salary = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [result,    setResult]    = useState(null);
  const [checking,  setChecking]  = useState(false);
  const [settings, setSettings] = useState(null);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [form, setForm] = useState({ employeeId: "", month: thisMonth });

  useEffect(() => {
    employeeAPI.getAll({ isActive: true }).then(res => {
      const emps = res.data.employees || [];
      setEmployees(emps);
      if (emps.length) setForm(f => ({ ...f, employeeId: emps[0].empId }));
    //settingsAPI.get().then(r => setSettings(r.data.settings)).catch(() => {});
    }).catch(() => toast.error(t("loadError")))
      .finally(() => setLoading(false));
  }, []);

  const check = async () => {
    if (!form.employeeId || !form.month) { toast.error(t("requiredFields")); return; }
    const [year, month] = form.month.split("-");
    setChecking(true);
    try {
      const res = await salaryAPI.getMonthly(form.employeeId, { month, year });
      setResult(res.data);
    } catch (err) { toast.error(err.message || t("saveError")); }
    finally { setChecking(false); }
  };

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">{t("salary")}</h1><p className="page-subtitle">{t("salaryDesc")}</p></div>
      </div>

      <div className="card" style={{ maxWidth: "500px", marginBottom: "20px" }}>
        <div className="card-header"><h3 className="card-title">💰 {t("salaryCalculator")}</h3></div>
        <div className="form-group">
          <label className="form-label">{t("selectEmployee")}</label>
          <select className="form-control" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
            {employees.map(e => (
              <option key={e.empId} value={e.empId}>
                {e.empId} — {e.name} ({e.salaryType === "monthly" ? `₹${e.monthlySalary}/mo` : `₹${e.dailyWage}/day`})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t("month")}</label>
          <input type="month" className="form-control" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} />
        </div>
        <button className="btn btn-primary w-full" onClick={check} disabled={checking}>
          {checking ? t("loading") : `💰 ${t("calculateSalary")}`}
        </button>
      </div>

      {result && <SalaryBreakdown r={result} t={t} />}
    </div>
  );
};

export default Salary;
