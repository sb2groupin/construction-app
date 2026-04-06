import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { expenseAPI } from "../../api/extra.api";
import { projectAPI } from "../../api/project.api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import { getAssetUrl } from "../../utils/url.utils";
import toast from "react-hot-toast";

const CATEGORIES = ["Labour","Material","Food","Transport","Tool","Misc"];
const STATUS_COLOR = { Pending: "warning", Approved: "success", Rejected: "danger" };

const ExpensesPage = () => {
  const { t } = useTranslation();
  const { isAdmin, user } = useAuth();
  const [expenses,  setExpenses]  = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [pettyCash, setPettyCash] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showSubmit,setShowSubmit]= useState(false);
  const [showPetty, setShowPetty] = useState(false);
  const [showReject,setShowReject]= useState(null);
  const [saving,    setSaving]    = useState(false);
  const [filterStatus, setFilterStatus] = useState("Pending");
  const [selectedProject, setSelectedProject] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const billRef = useRef();

  const [form, setForm] = useState({ projectId: "", amount: "", category: "Material", description: "" });
  const [pettyForm, setPettyForm] = useState({ projectId: "", amount: "" });

  useEffect(() => {
    projectAPI.getAll().then(res => {
      const p = res.data.projects || [];
      setProjects(p);
      if (p.length) { setSelectedProject(p[0]._id); setForm(f => ({ ...f, projectId: p[0]._id })); setPettyForm(f => ({ ...f, projectId: p[0]._id })); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [filterStatus, selectedProject]);

  const load = async () => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    if (selectedProject && isAdmin) params.projectId = selectedProject;
    try {
      const [expRes, pcRes] = await Promise.all([
        expenseAPI.getAll(params),
        isAdmin && selectedProject ? expenseAPI.getPettyCash({ projectId: selectedProject }) : Promise.resolve(null),
      ]);
      setExpenses(expRes.data.expenses || []);
      if (pcRes) setPettyCash(pcRes.data.pettyCash);
    } catch { toast.error(t("loadError")); }
  };

  const handleSubmit = async () => {
    if (!form.projectId || !form.amount || !form.description) { toast.error(t("requiredFields")); return; }
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (billRef.current?.files[0]) fd.append("bill", billRef.current.files[0]);
    try { await expenseAPI.submit(fd); toast.success(t("expenseAdded")); setShowSubmit(false); load(); }
    catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const approve = async (id) => {
    try { await expenseAPI.review(id, { action: "Approved" }); toast.success(t("approveSuccess")); load(); }
    catch { toast.error(t("saveError")); }
  };

  const reject = async () => {
    if (!rejectNote) { toast.error(t("reasonRequired")); return; }
    try { await expenseAPI.review(showReject._id, { action: "Rejected", adminNote: rejectNote }); toast.success(t("rejectSuccess")); setShowReject(null); setRejectNote(""); load(); }
    catch { toast.error(t("saveError")); }
  };

  const addPettyCash = async () => {
    if (!pettyForm.projectId || !pettyForm.amount) { toast.error(t("requiredFields")); return; }
    setSaving(true);
    try { await expenseAPI.addPettyCash(pettyForm); toast.success(`₹${pettyForm.amount} ${t("pettyCashAdded")}`); setShowPetty(false); load(); }
    catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const totalApproved = expenses.filter(e => e.status === "Approved").reduce((s, e) => s + e.amount, 0);

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">{t("expenses")}</h1><p className="page-subtitle">{t("expenseDesc")}</p></div>
        <div style={{ display: "flex", gap: "8px" }}>
          {isAdmin && <button className="btn btn-outline" onClick={() => setShowPetty(true)}>💵 {t("pettyCash")}</button>}
          <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>+ {t("submitExpense")}</button>
        </div>
      </div>

      {/* Petty Cash Widget */}
      {isAdmin && pettyCash && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" }}>
          {[
            { label: t("totalGiven"), value: pettyCash.totalGiven, color: "var(--primary)" },
            { label: t("totalSpent"), value: pettyCash.totalSpent, color: "var(--danger)" },
            { label: t("balance"),     value: pettyCash.balance,    color: "var(--success)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color }}>₹{(value || 0).toLocaleString("en-IN")}</div>
              <div style={{ fontSize: "12px", color: "var(--gray-400)", marginTop: "4px" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
        {[t("pending"),t("approved"),t("rejected"),""].map(s => (
          <button key={s} onClick={() => setFilterStatus(s === "" ? "" : s === t("pending") ? "Pending" : s === t("approved") ? "Approved" : "Rejected")} className="btn btn-sm"
            style={{ background: (s === "" && filterStatus === "") || (s !== "" && filterStatus === (s === t("pending") ? "Pending" : s === t("approved") ? "Approved" : "Rejected")) ? "var(--primary)" : "var(--gray-100)", color: (s === "" && filterStatus === "") || (s !== "" && filterStatus === (s === t("pending") ? "Pending" : s === t("approved") ? "Approved" : "Rejected")) ? "white" : "var(--gray-600)", border: "none" }}>
            {s === "" ? t("all") : s}
          </button>
        ))}
        {isAdmin && (
          <select className="form-control" style={{ width: "auto", marginLeft: "auto" }} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="">{t("allSites")}</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        )}
      </div>

      <div className="card">
        {expenses.length === 0 ? (
          <div className="empty-state"><span style={{ fontSize: "36px" }}>💰</span><p>{t("noExpenses")}</p></div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>{t("date")}</th><th>{t("category")}</th><th>{t("amount")}</th><th>{t("by")}</th><th>{t("description")}</th><th>{t("bill")}</th><th>{t("status")}</th>{isAdmin && <th>{t("actions")}</th>}</tr></thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e._id}>
                      <td style={{ fontSize: "12px" }}>{new Date(e.createdAt).toLocaleDateString("en-IN")}</td>
                      <td><Badge type="primary">{e.category}</Badge></td>
                      <td style={{ fontWeight: 700, color: "var(--danger)" }}>₹{e.amount.toLocaleString("en-IN")}</td>
                      <td style={{ fontSize: "13px" }}>{e.submittedBy}</td>
                      <td style={{ fontSize: "13px", maxWidth: "180px", color: "var(--gray-600)" }}>{e.description}</td>
                      <td>{e.billPhoto ? <a href={getAssetUrl(e.billPhoto)} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--primary)" }}>View</a> : "—"}</td>
                      <td>
                        <Badge type={STATUS_COLOR[e.status]}>{e.status}</Badge>
                        {e.adminNote && <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "2px" }}>{e.adminNote}</div>}
                      </td>
                      {isAdmin && (
                        <td>
                          {e.status === "Pending" && (
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button className="btn btn-success btn-sm" onClick={() => approve(e._id)}>✅</button>
                              <button className="btn btn-danger btn-sm" onClick={() => setShowReject(e)}>❌</button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 0 0", textAlign: "right", fontSize: "14px", color: "var(--gray-600)" }}>
              {t("approvedTotal")}: <strong style={{ color: "var(--success)", fontSize: "16px" }}>₹{totalApproved.toLocaleString("en-IN")}</strong>
            </div>
          </>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmit && (
        <Modal title={t("submitExpense")} onClose={() => setShowSubmit(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowSubmit(false)}>{t("cancel")}</button><button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? t("loading") : t("submit")}</button></>}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t("site")} *</label>
              <select className="form-control" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("expenseCategory")} *</label>
              <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("amount")} (₹) *</label><input type="number" className="form-control" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">{t("description")} *</label><textarea className="form-control" rows={2} placeholder={t("expenseDetails")} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">{t("billPhoto")}</label><input ref={billRef} type="file" accept="image/*" className="form-control" /></div>
        </Modal>
      )}

      {/* Petty Cash Modal */}
      {showPetty && (
        <Modal title={t("addPettyCash")} onClose={() => setShowPetty(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowPetty(false)}>{t("cancel")}</button><button className="btn btn-success" onClick={addPettyCash} disabled={saving}>{saving ? t("loading") : t("addCash")}</button></>}>
          <div className="form-group"><label className="form-label">{t("site")} *</label>
            <select className="form-control" value={pettyForm.projectId} onChange={e => setPettyForm({ ...pettyForm, projectId: e.target.value })}>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">{t("amount")} (₹) *</label><input type="number" className="form-control" placeholder="5000" value={pettyForm.amount} onChange={e => setPettyForm({ ...pettyForm, amount: e.target.value })} /></div>
        </Modal>
      )}

      {/* Reject Modal */}
      {showReject && (
        <Modal title={t("rejectExpense")} onClose={() => { setShowReject(null); setRejectNote(""); }}
          footer={<><button className="btn btn-outline" onClick={() => { setShowReject(null); setRejectNote(""); }}>{t("cancel")}</button><button className="btn btn-danger" onClick={reject}>{t("reject")}</button></>}>
          <p style={{ fontSize: "13px", color: "var(--gray-400)", marginBottom: "12px" }}>₹{showReject.amount} — {showReject.description}</p>
          <div className="form-group"><label className="form-label">{t("reason")} *</label><textarea className="form-control" rows={2} value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder={t("rejectReason")} /></div>
        </Modal>
      )}
    </div>
  );
};

export default ExpensesPage;
