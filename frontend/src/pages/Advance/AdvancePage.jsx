import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { advanceAPI } from "../../api/advance.api";
import { employeeAPI } from "../../api/employee.api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

const STATUS_COLOR = { Pending: "warning", Approved: "success", Rejected: "danger" };

const AdvancePage = () => {
  const { t } = useTranslation();
  const { isAdmin, user } = useAuth();
  const [advances,   setAdvances]   = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showReq,    setShowReq]    = useState(false);
  const [showApprove,setShowApprove]= useState(null);
  const [saving,     setSaving]     = useState(false);
  const [filterStatus, setFilterStatus] = useState("Pending");

  const [reqForm, setReqForm] = useState({ employeeId: "", amount: "", reason: "", monthlyDeduction: "" });
  const [appForm, setAppForm] = useState({ monthlyDeduction: "", adminNote: "" });

  useEffect(() => {
    const init = async () => {
      try {
        if (isAdmin) {
          const [adv, emp] = await Promise.all([
            advanceAPI.getAll(filterStatus ? { status: filterStatus } : {}),
            employeeAPI.getAll({ isActive: true }),
          ]);
          setAdvances(adv.data.advances || []);
          setEmployees(emp.data.employees || []);
          if (emp.data.employees?.length) setReqForm(f => ({ ...f, employeeId: emp.data.employees[0].empId }));
        } else {
          const res = await advanceAPI.getAll();
          setAdvances(res.data.advances || []);
        }
      } catch { toast.error(t("loadError")); }
      finally { setLoading(false); }
    };
    init();
  }, [filterStatus, isAdmin]);

  const loadAdvances = async () => {
    try {
      const res = await advanceAPI.getAll(filterStatus ? { status: filterStatus } : {});
      setAdvances(res.data.advances || []);
    } catch {}
  };

  const handleRequest = async () => {
    if (!reqForm.amount) { toast.error(t("amountRequired")); return; }
    setSaving(true);
    try {
      const payload = isAdmin
        ? reqForm
        : { amount: reqForm.amount, reason: reqForm.reason, monthlyDeduction: reqForm.monthlyDeduction };
      await advanceAPI.request(payload);
      toast.success(t("advanceRequested"));
      setShowReq(false);
      loadAdvances();
    } catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const handleApprove = async () => {
    if (!appForm.monthlyDeduction) { toast.error(t("deductionRequired")); return; }
    setSaving(true);
    try {
      await advanceAPI.approve(showApprove._id, appForm);
      toast.success(t("approveSuccess"));
      setShowApprove(null);
      loadAdvances();
    } catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const handleReject = async (id) => {
    try {
      await advanceAPI.reject(id, { adminNote: "Rejected by admin" });
      toast.success(t("rejectSuccess"));
      loadAdvances();
    } catch { toast.error(t("saveError")); }
  };

  const totalPending = advances.filter(a => a.status === "Approved" && !a.isFullyRecovered)
    .reduce((s, a) => s + a.remainingAmount, 0);

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("advanceSalaryTitle")}</h1>
          <p className="page-subtitle">{t("advanceSalarySubtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowReq(true)}>+ Request Advance</button>
      </div>

      {/* Summary */}
      {isAdmin && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" }}>
          {[
            { label: t("pendingRequests"), val: advances.filter(a => a.status === "Pending").length, color: "var(--warning)" },
            { label: t("activeRecoveries"), val: advances.filter(a => a.status === "Approved" && !a.isFullyRecovered).length, color: "var(--primary)" },
            { label: t("totalOutstanding"), val: `₹${totalPending.toLocaleString("en-IN")}`, color: "var(--danger)" },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: "12px", color: "var(--gray-400)", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
        {["Pending","Approved","Rejected",""].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className="btn btn-sm"
            style={{ background: filterStatus === s ? "var(--primary)" : "var(--gray-100)", color: filterStatus === s ? "white" : "var(--gray-600)", border: "none" }}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="card">
        {advances.length === 0 ? (
          <div className="empty-state"><span style={{ fontSize: "36px" }}>💰</span><p>Koi advance request nahi</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Amount</th><th>Monthly Deduction</th>
                  <th>Recovered</th><th>Remaining</th><th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {advances.map(a => (
                  <tr key={a._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.employeeName || a.employeeId}</div>
                      <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>{a.reason || "—"}</div>
                      <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>{a.requestDate}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--primary)" }}>₹{a.amount.toLocaleString("en-IN")}</td>
                    <td>{a.monthlyDeduction > 0 ? `₹${a.monthlyDeduction.toLocaleString("en-IN")}/month` : "—"}</td>
                    <td style={{ color: "var(--success)", fontWeight: 500 }}>
                      {a.recoveredAmount > 0 ? `₹${a.recoveredAmount.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td>
                      {a.status === "Approved" ? (
                        a.isFullyRecovered
                          ? <span style={{ color: "var(--success)", fontSize: "12px" }}>✅ Fully recovered</span>
                          : <span style={{ color: "var(--danger)", fontWeight: 600 }}>₹{a.remainingAmount.toLocaleString("en-IN")}</span>
                      ) : "—"}
                    </td>
                    <td>
                      <Badge type={STATUS_COLOR[a.status]}>{a.status}</Badge>
                      {a.adminNote && <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "2px" }}>{a.adminNote}</div>}
                    </td>
                    {isAdmin && (
                      <td>
                        {a.status === "Pending" && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button className="btn btn-success btn-sm" onClick={() => { setShowApprove(a); setAppForm({ monthlyDeduction: "", adminNote: "" }); }}>✅ Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(a._id)}>❌</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showReq && (
        <Modal title={t("requestAdvanceSalary")} onClose={() => setShowReq(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowReq(false)}>Cancel</button><button className="btn btn-primary" onClick={handleRequest} disabled={saving}>{saving ? "..." : "Submit Request"}</button></>}>
          {isAdmin && (
            <div className="form-group"><label className="form-label">{t("employeeField")} *</label>
              <select className="form-control" value={reqForm.employeeId} onChange={e => setReqForm({ ...reqForm, employeeId: e.target.value })}>
                {employees.map(e => <option key={e.empId} value={e.empId}>{e.empId} — {e.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group"><label className="form-label">{t("amount")} (₹) *</label><input type="number" className="form-control" placeholder="5000" value={reqForm.amount} onChange={e => setReqForm({ ...reqForm, amount: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">{t("reasonField")}</label><textarea className="form-control" rows={2} placeholder={t("leaveReasonPlaceholder")} value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} /></div>
          <div className="form-group">
            <label className="form-label">{t("monthlyDeductionAmount")} (₹)</label>
            <input type="number" className="form-control" placeholder="1000/month" value={reqForm.monthlyDeduction} onChange={e => setReqForm({ ...reqForm, monthlyDeduction: e.target.value })} />
            <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "4px" }}>Admin final decision karega</div>
          </div>
        </Modal>
      )}

      {/* Approve Modal */}
      {showApprove && (
        <Modal title={t("approveAdvance")} onClose={() => setShowApprove(null)}
          footer={<><button className="btn btn-outline" onClick={() => setShowApprove(null)}>Cancel</button><button className="btn btn-success" onClick={handleApprove} disabled={saving}>{saving ? "..." : "Approve"}</button></>}>
          <p style={{ fontSize: "13px", color: "var(--gray-400)", marginBottom: "14px" }}>
            {showApprove.employeeName} — Amount: <strong>₹{showApprove.amount.toLocaleString("en-IN")}</strong>
          </p>
          <div className="form-group">
            <label className="form-label">{t("monthlyDeductionAmount")} (₹) *</label>
            <input type="number" className="form-control" placeholder="1000" value={appForm.monthlyDeduction} onChange={e => setAppForm({ ...appForm, monthlyDeduction: e.target.value })} />
            {appForm.monthlyDeduction > 0 && showApprove.amount > 0 && (
              <div style={{ fontSize: "11px", color: "var(--primary)", marginTop: "4px" }}>
                Recovery time: ~{Math.ceil(showApprove.amount / appForm.monthlyDeduction)} months
              </div>
            )}
          </div>
          <div className="form-group"><label className="form-label">{t("notes")}</label><input className="form-control" placeholder={t("notes")} value={appForm.adminNote} onChange={e => setAppForm({ ...appForm, adminNote: e.target.value })} /></div>
        </Modal>
      )}
    </div>
  );
};

export default AdvancePage;
