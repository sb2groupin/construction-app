import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { leaveAPI } from "../../api/leave.api";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

const STATUS_COLOR = { Pending: "warning", Approved: "success", Rejected: "danger" };

const Leaves = () => {
  const { t } = useTranslation();
  const [leaves,  setLeaves]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Pending");
  const [rejectModal, setRejectModal] = useState(null);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await leaveAPI.getAll(filterStatus ? { status: filterStatus } : {});
      setLeaves(res.data.leaves || []);
    } catch { toast.error(t("loadError")); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const approve = async (id) => {
    try {
      await leaveAPI.approve(id, { remark: "Approved" });
      toast.success(t("approveSuccess"));
      load();
    } catch { toast.error(t("saveError")); }
  };

  const reject = async () => {
    if (!remark) { toast.error(t("reasonRequired")); return; }
    setSaving(true);
    try {
      await leaveAPI.reject(rejectModal._id, { remark });
      toast.success(t("rejectSuccess"));
      setRejectModal(null); setRemark("");
      load();
    } catch { toast.error(t("saveError")); }
    finally { setSaving(false); }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("leaveManagement")}</h1>
          <p className="page-subtitle">{t("leaveManagementSubtitle")}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["Pending", "Approved", "Rejected", ""].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className="btn btn-sm"
            style={{ background: filterStatus === s ? "var(--primary)" : "var(--gray-100)", color: filterStatus === s ? "white" : "var(--gray-600)", border: "none" }}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? <Loader fullPage={false} /> : leaves.length === 0 ? (
          <div className="empty-state"><span style={{ fontSize: "36px" }}>📋</span><p>Koi leave request nahi</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l._id}>
                    <td><div style={{ fontWeight: 500 }}>{l.employeeName || l.employeeId}</div><div style={{ fontSize: "11px", color: "var(--gray-400)" }}>{l.employeeId}</div></td>
                    <td><Badge type="primary">{l.type}</Badge></td>
                    <td style={{ fontSize: "13px" }}>{l.startDate} → {l.endDate}</td>
                    <td style={{ fontWeight: 500, textAlign: "center" }}>{l.totalDays}</td>
                    <td style={{ maxWidth: "180px", fontSize: "13px", color: "var(--gray-600)" }}>{l.reason}</td>
                    <td>
                      <Badge type={STATUS_COLOR[l.status]}>{l.status}</Badge>
                      {l.adminRemark && l.status !== "Pending" && (
                        <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "3px" }}>{l.adminRemark}</div>
                      )}
                    </td>
                    <td>
                      {l.status === "Pending" && (
                        <div className="flex gap-2">
                          <button className="btn btn-success btn-sm" onClick={() => approve(l._id)}>✅ Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setRejectModal(l)}>❌ Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <Modal title="Leave Reject Karo" onClose={() => { setRejectModal(null); setRemark(""); }}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => { setRejectModal(null); setRemark(""); }}>Cancel</button>
              <button className="btn btn-danger" onClick={reject} disabled={saving}>{saving ? "..." : "Reject"}</button>
            </>
          }
        >
          <p style={{ fontSize: "13px", color: "var(--gray-400)", marginBottom: "12px" }}>
            {rejectModal.employeeName} — {rejectModal.type} ({rejectModal.totalDays} days)
          </p>
          <div className="form-group">
            <label className="form-label">{t("rejectionReasonLabel")} *</label>
            <textarea className="form-control" rows={3} placeholder="Kyun reject kar rahe ho..." value={remark} onChange={e => setRemark(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Leaves;
