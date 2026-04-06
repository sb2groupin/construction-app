import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { employeeAPI } from "../../api/employee.api";
import { attendanceAPI } from "../../api/attendance.api";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import FlaggedAttendance from "./FlaggedAttendance";
import AttendanceCalendar from "../../components/common/AttendanceCalendar";
import { getAssetUrl } from "../../utils/url.utils";
import toast from "react-hot-toast";

const Attendance = () => {
  const { t } = useTranslation();
  const [tab,       setTab]       = useState("mark");
  const [employees, setEmployees] = useState([]);
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [marking,   setMarking]   = useState(false);
  const [bulkMarking, setBulkMarking] = useState(false);
  const [calEmpId,  setCalEmpId]  = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [form,   setForm]    = useState({ employeeId: "", date: today, present: "true", isHalfDay: false, notes: "" });
  const [filterMonth, setFilterMonth] = useState(today.slice(0, 7));

  useEffect(() => {
    employeeAPI.getAll({ isActive: true }).then(res => {
      const emps = res.data.employees || [];
      setEmployees(emps);
      if (emps.length) { setForm(f => ({ ...f, employeeId: emps[0].empId })); setCalEmpId(emps[0].empId); }
    }).catch(() => toast.error(t("loadError")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (form.employeeId && tab === "records") loadRecords(); }, [form.employeeId, filterMonth, tab]);

  const loadRecords = async () => {
    const [y, m] = filterMonth.split("-");
    try {
      const res = await attendanceAPI.getAll({ employeeId: form.employeeId, month: m, year: y });
      setRecords(res.data.attendance || []);
    } catch {}
  };

  const handleMark = async () => {
    if (!form.employeeId || !form.date) { toast.error(t("requiredFields")); return; }
    setMarking(true);
    try {
      await attendanceAPI.mark({ ...form, present: form.present === "true" });
      toast.success(t("attendanceMarked"));
      loadRecords();
    } catch (err) { toast.error(err.message || t("saveError")); }
    finally { setMarking(false); }
  };

  // Bulk mark all employees for a date
  const handleBulkMark = async (status) => {
    if (!confirm(`${t("markAllEmployees")} ${employees.length} ${t("employees")} ${status === "true" ? t("present") : t("absent")}?`)) return;
    setBulkMarking(true);
    let success = 0, failed = 0;
    for (const emp of employees) {
      try {
        await attendanceAPI.mark({ employeeId: emp.empId, date: today, present: status === "true" });
        success++;
      } catch { failed++; }
    }
    toast.success(`${success} ${t("marked")}, ${failed} ${t("alreadyDone")}`);
    setBulkMarking(false);
  };

  const p = records.filter(r => r.present && !r.isHalfDay).length;
  const h = records.filter(r => r.isHalfDay).length;
  const a = records.filter(r => !r.present).length;

  if (loading) return <Loader fullPage={false} />;

  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)} className="btn btn-sm"
      style={{ background: tab === id ? "var(--primary)" : "var(--gray-100)", color: tab === id ? "white" : "var(--gray-600)", border: "none" }}>
      {label}
    </button>
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">{t("attendance")}</h1></div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {tabBtn("mark",     `✅ ${t("mark")}`)}
          {tabBtn("bulk",     `👥 ${t("bulk")}`)}
          {tabBtn("records",  `📋 ${t("records")}`)}
          {tabBtn("calendar", `📅 ${t("calendar")}`)}
          {tabBtn("flagged",  `⚠️ ${t("flagged")}`)}
        </div>
      </div>

      {/* Mark Tab */}
      {tab === "mark" && (
        <div className="card" style={{ maxWidth: "560px" }}>
          <div className="card-header"><h3 className="card-title">{t("attendanceMarkingTitle")}</h3></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t("selectEmployee")}</label>
              <select className="form-control" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                {employees.map(e => <option key={e.empId} value={e.empId}>{e.empId} — {e.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("date")}</label>
              <input type="date" className="form-control" value={form.date} max={today} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group"><label className="form-label">{t("status")}</label>
              <select className="form-control" value={form.present} onChange={e => setForm({ ...form, present: e.target.value })}>
                <option value="true">✅ {t("present")}</option>
                <option value="false">❌ {t("absent")}</option>
              </select>
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "24px" }}>
              <input type="checkbox" id="halfday" checked={form.isHalfDay} onChange={e => setForm({ ...form, isHalfDay: e.target.checked })} />
              <label htmlFor="halfday" className="form-label" style={{ margin: 0 }}>🌗 {t("halfDay")}</label>
            </div>
            <div className="form-group"><label className="form-label">{t("notes")}</label>
              <input className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleMark} disabled={marking}>{marking ? t("loading") : t("attendanceMarkingTitle")}</button>
        </div>
      )}

      {/* Bulk Tab */}
      {tab === "bulk" && (
        <div className="card" style={{ maxWidth: "500px" }}>
          <div className="card-header"><h3 className="card-title">👥 {t("bulkAttendance")} — {today}</h3></div>
          <p style={{ fontSize: "13px", color: "var(--gray-500)", marginBottom: "16px" }}>
            {employees.length} {t("activeEmployees")} {t("bulkMarkingDesc")}.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleBulkMark("true")} disabled={bulkMarking}>
              {bulkMarking ? "..." : `✅ ${t("allPresent")} (${employees.length})`}
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleBulkMark("false")} disabled={bulkMarking}>
              {bulkMarking ? "..." : `❌ ${t("allAbsent")} (${employees.length})`}
            </button>
          </div>
          <div style={{ marginTop: "12px", padding: "10px", background: "var(--gray-50)", borderRadius: "8px", fontSize: "12px", color: "var(--gray-500)" }}>
            {t("bulkMarkingNote")}
          </div>
        </div>
      )}

      {/* Records Tab */}
      {tab === "records" && (
        <div className="card">
          <div className="card-header">
            <div>
              <select className="form-control" style={{ maxWidth: "240px" }} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                {employees.map(e => <option key={e.empId} value={e.empId}>{e.empId} — {e.name}</option>)}
              </select>
            </div>
            <div style={{ textAlign: "right" }}>
              <input type="month" className="form-control" style={{ width: "auto" }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
              <div style={{ fontSize: "12px", color: "var(--gray-400)", marginTop: "4px" }}>✅{p} 🌗{h} ❌{a}</div>
            </div>
          </div>
          {records.length === 0 ? <div className="empty-state"><span style={{ fontSize: "36px" }}>📅</span><p>{t("noRecords")}</p></div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>{t("date")}</th><th>{t("status")}</th><th>{t("location")}</th><th>{t("checkIn")}</th><th>{t("checkOut")}</th><th>{t("hours")}</th><th>{t("selfie")}</th></tr></thead>
              <tbody>{records.map(r => (
                <tr key={r._id}>
                  <td>{r.date}</td>
                  <td>
                    {r.present
                      ? r.isHalfDay ? <Badge type="warning">🌗 {t("halfDay")}</Badge> : <Badge type="success">{t("present")}</Badge>
                      : <Badge type="danger">{t("absent")}</Badge>}
                  </td>
                  <td>{r.location?.latitude ? r.location.isValid ? <Badge type="success">✅</Badge> : <Badge type="danger">⚠️{r.location.distanceFromSite}m</Badge> : "—"}</td>
                  <td style={{ fontSize: "12px" }}>{r.checkInTime  ? new Date(r.checkInTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "—"}</td>
                  <td style={{ fontSize: "12px" }}>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "—"}</td>
                  <td style={{ fontSize: "12px" }}>{r.workingHours ? `${r.workingHours}h` : "—"}</td>
                  <td>{r.selfiePhoto ? <img src={getAssetUrl(r.selfiePhoto)} alt="s" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} /> : "—"}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {tab === "calendar" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📅 {t("attendanceCalendar")}</h3>
            <select className="form-control" style={{ width: "auto" }} value={calEmpId} onChange={e => setCalEmpId(e.target.value)}>
              {employees.map(e => <option key={e.empId} value={e.empId}>{e.empId} — {e.name}</option>)}
            </select>
          </div>
          <AttendanceCalendar employeeId={calEmpId} />
        </div>
      )}

      {/* Flagged Tab */}
      {tab === "flagged" && <div className="card"><FlaggedAttendance /></div>}
    </div>
  );
};

export default Attendance;
