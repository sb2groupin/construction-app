import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { leaveAPI } from "../../api/leave.api";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const STATUS_COLOR = { Pending: "warning", Approved: "success", Rejected: "danger" };
const today = new Date().toISOString().split("T")[0];

const MyLeaves = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [leaves,   setLeaves]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({ type: "Sick", startDate: today, endDate: today, reason: "" });

  const load = async () => {
    try {
      const res = await leaveAPI.getAll();
      setLeaves(res.data.leaves || []);
    } catch { toast.error(t('leaveLoadError')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const apply = async () => {
    if (!form.reason) { toast.error(t('reasonRequired')); return; }
    if (form.startDate > form.endDate) { toast.error(t('startDateBeforeEnd')); return; }
    setApplying(true);
    try {
      await leaveAPI.apply({ ...form, employeeId: user.employeeId });
      toast.success(t('leaveApplied') + " ✅");
      setForm({ type: "Sick", startDate: today, endDate: today, reason: "" });
      load();
    } catch (err) { toast.error(err.message || t('leaveApplyError')); }
    finally { setApplying(false); }
  };

  const cancel = async (id) => {
    if (!confirm(t('confirmCancelLeave'))) return;
    try { await leaveAPI.cancel(id); toast.success(t('leaveCancelled')); load(); }
    catch (err) { toast.error(err.message || t('leaveCancelError')); }
  };

  const calcDays = () => {
    const diff = Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000*60*60*24)) + 1;
    return diff > 0 ? diff : 1;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">🏖️ {t('myLeavesTitle')}</h1><p className="page-subtitle">{t('applyAndCheckStatus')}</p></div>
      </div>

      {/* Apply form */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-header"><h3 className="card-title">📋 {t('applyLeave')}</h3></div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">{t('leaveType')}</label>
            <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {["Sick", "Casual", "Earned", "Other"].map(t_key => <option key={t_key}>{t(t_key === "Sick" ? 'leaveType_sick' : t_key === "Casual" ? 'leaveType_casual' : t_key === "Earned" ? 'leaveType_earned' : 'leaveType_other')}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('startDate')}</label>
            <input type="date" className="form-control" value={form.startDate} min={today} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('endDate')}</label>
            <input type="date" className="form-control" value={form.endDate} min={form.startDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="form-group" style={{ display: "flex", alignItems: "flex-end", paddingBottom: "2px" }}>
            <div style={{ fontSize: "14px", color: "var(--gray-600)" }}>
              {t('total')} <strong style={{ color: "var(--primary)" }}>{calcDays()} {calcDays() > 1 ? t('days') : t('day')}</strong>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('leaveReason')} *</label>
          <textarea className="form-control" rows={2} placeholder={t('leaveReasonPlaceholder')} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
        </div>
        <button className="btn btn-primary" onClick={apply} disabled={applying}>
          {applying ? t('applying') : "📋 " + t('applyLeave')}
        </button>
      </div>

      {/* Leave history */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">{t('leaveHistory')}</h3></div>
        {loading ? <Loader fullPage={false} /> : leaves.length === 0 ? (
          <div className="empty-state"><span style={{ fontSize: "36px" }}>🏖️</span><p>{t('noLeaves')}</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t('leaveType')}</th><th>Dates</th><th>Days</th><th>Reason</th><th>{t('status')}</th><th>Remark</th><th>Action</th></tr></thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l._id}>
                    <td><Badge type="primary">{t(l.type === "Sick" ? 'leaveType_sick' : l.type === "Casual" ? 'leaveType_casual' : l.type === "Earned" ? 'leaveType_earned' : 'leaveType_other')}</Badge></td>
                    <td style={{ fontSize: "13px" }}>{l.startDate} → {l.endDate}</td>
                    <td style={{ textAlign: "center", fontWeight: 500 }}>{l.totalDays}</td>
                    <td style={{ fontSize: "13px", color: "var(--gray-600)", maxWidth: "160px" }}>{l.reason}</td>
                    <td><Badge type={STATUS_COLOR[l.status]}>{l.status}</Badge></td>
                    <td style={{ fontSize: "12px", color: "var(--gray-400)" }}>{l.adminRemark || "—"}</td>
                    <td>
                      {l.status === "Pending" && (
                        <button className="btn btn-outline btn-sm" onClick={() => cancel(l._id)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLeaves;
