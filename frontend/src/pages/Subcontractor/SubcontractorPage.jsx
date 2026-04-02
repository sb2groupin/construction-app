import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { subcontractorAPI } from "../../api/extra.api";
import { projectAPI } from "../../api/project.api";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

const STATUS_COLOR = { Active:"success", Completed:"primary", "On Hold":"warning", Terminated:"danger" };
const TRADES = ["General","Plumber","Electrician","Mason","Carpenter","Waterproofing","Painting","Tiling","Fabrication","Other"];
const EMPTY = { name:"", trade:"Plumber", phone:"", company:"", email:"", address:"", projectId:"", workScope:"", contractAmount:"", startDate:"", endDate:"" };

const SubcontractorPage = () => {
  const { t } = useTranslation();
  const [list,      setList]     = useState([]);
  const [projects,  setProjects] = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [showAdd,   setShowAdd]  = useState(false);
  const [showPay,   setShowPay]  = useState(null);
  const [showDetail,setShowDetail]=useState(null);
  const [saving,    setSaving]   = useState(false);
  const [form,      setForm]     = useState(EMPTY);
  const [payForm,   setPayForm]  = useState({ amount:"", date: new Date().toISOString().split("T")[0], note:"" });
  const [filterProject, setFilterProject] = useState("");

  useEffect(() => {
    Promise.all([subcontractorAPI.getAll(), projectAPI.getAll()])
      .then(([sRes, pRes]) => { setList(sRes.data.subcontractors||[]); setProjects(pRes.data.projects||[]); })
      .catch(() => toast.error(t("loadError")))
      .finally(() => setLoading(false));
  }, []);

  const load = async () => {
    const params = filterProject ? { projectId: filterProject } : {};
    const res = await subcontractorAPI.getAll(params);
    setList(res.data.subcontractors||[]);
  };

  useEffect(() => { load(); }, [filterProject]);

  const handleSave = async () => {
    if (!form.name) { toast.error(t("nameRequired")); return; }
    setSaving(true);
    try {
      await subcontractorAPI.create(form);
      toast.success(t("subcontractorAdded"));
      setShowAdd(false); setForm(EMPTY); load();
    } catch (err) { toast.error(err.message||t("saveError")); }
    finally { setSaving(false); }
  };

  const handlePayment = async () => {
    if (!payForm.amount) { toast.error(t("amountRequired")); return; }
    setSaving(true);
    try {
      await subcontractorAPI.addPayment(showPay._id, payForm);
      toast.success(t("paymentRecorded"));
      setShowPay(null); setPayForm({ amount:"", date:new Date().toISOString().split("T")[0], note:"" });
      load();
    } catch (err) { toast.error(err.message||t("saveError")); }
    finally { setSaving(false); }
  };

  const handleRemove = async (id, name) => {
    if (!confirm(t("confirmRemove", { name }))) return;
    try { await subcontractorAPI.remove(id); toast.success(t("deleteSuccess")); load(); }
    catch { toast.error(t("deleteFailed")); }
  };

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  if (loading) return <Loader fullPage={false} />;

  const totalContract = list.reduce((s, x) => s + (x.contractAmount||0), 0);
  const totalPaid     = list.reduce((s, x) => s + (x.totalPaid||0), 0);
  const totalBalance  = list.reduce((s, x) => s + (x.balanceDue||0), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">Subcontractors</h1><p className="page-subtitle">Third-party contractors ka hisaab</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setShowAdd(true); }}>+ Add Subcontractor</button>
      </div>

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"16px" }}>
        {[
          { label:"Total Contract Value", value:`₹${totalContract.toLocaleString("en-IN")}`, color:"var(--primary)" },
          { label:"Total Paid",           value:`₹${totalPaid.toLocaleString("en-IN")}`,     color:"var(--success)"},
          { label:"Balance Due",          value:`₹${totalBalance.toLocaleString("en-IN")}`,  color:"var(--danger)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"20px", fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:"12px", color:"var(--gray-400)", marginTop:"4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ marginBottom:"14px", display:"flex", gap:"10px", alignItems:"center" }}>
        <select className="form-control" style={{ width:"auto" }} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="">All Sites</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <span style={{ fontSize:"13px", color:"var(--gray-400)" }}>{list.length} subcontractors</span>
      </div>

      <div className="card">
        {list.length === 0 ? (
          <div className="empty-state"><span style={{ fontSize:"40px" }}>👥</span><p>Koi subcontractor nahi</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Trade</th><th>Site</th><th>Contract</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {list.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight:500 }}>{s.name}</div>
                      {s.company && <div style={{ fontSize:"11px", color:"var(--gray-400)" }}>{s.company}</div>}
                      {s.phone   && <div style={{ fontSize:"11px", color:"var(--gray-400)" }}>📞 {s.phone}</div>}
                    </td>
                    <td><Badge type="primary">{s.trade}</Badge></td>
                    <td style={{ fontSize:"13px" }}>{s.projectId?.name||"—"}</td>
                    <td style={{ fontWeight:600 }}>₹{(s.contractAmount||0).toLocaleString("en-IN")}</td>
                    <td style={{ color:"var(--success)", fontWeight:500 }}>₹{(s.totalPaid||0).toLocaleString("en-IN")}</td>
                    <td style={{ color:"var(--danger)", fontWeight:600 }}>₹{(s.balanceDue||0).toLocaleString("en-IN")}</td>
                    <td><Badge type={STATUS_COLOR[s.status]}>{s.status}</Badge></td>
                    <td>
                      <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowDetail(s)}>👁️</button>
                        <button className="btn btn-success btn-sm" onClick={() => { setShowPay(s); setPayForm({ amount:"", date:new Date().toISOString().split("T")[0], note:"" }); }}>💵 Pay</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemove(s._id, s.name)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add Subcontractor" onClose={() => setShowAdd(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?"...":"Add"}</button></>}>
          <div style={{ maxHeight:"60vh", overflowY:"auto" }}>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Name *</label><input className="form-control" value={form.name} onChange={f("name")} /></div>
              <div className="form-group"><label className="form-label">Trade</label>
                <select className="form-control" value={form.trade} onChange={f("trade")}>
                  {TRADES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={f("phone")} /></div>
              <div className="form-group"><label className="form-label">Company</label><input className="form-control" value={form.company} onChange={f("company")} /></div>
              <div className="form-group"><label className="form-label">Site</label>
                <select className="form-control" value={form.projectId} onChange={f("projectId")}>
                  <option value="">No site</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Contract Amount (₹)</label><input type="number" className="form-control" value={form.contractAmount} onChange={f("contractAmount")} /></div>
              <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-control" value={form.startDate} onChange={f("startDate")} /></div>
              <div className="form-group"><label className="form-label">End Date</label><input type="date" className="form-control" value={form.endDate} onChange={f("endDate")} /></div>
            </div>
            <div className="form-group"><label className="form-label">Work Scope</label><textarea className="form-control" rows={2} value={form.workScope} onChange={f("workScope")} /></div>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {showPay && (
        <Modal title={`Record Payment — ${showPay.name}`} onClose={() => setShowPay(null)}
          footer={<><button className="btn btn-outline" onClick={() => setShowPay(null)}>Cancel</button><button className="btn btn-success" onClick={handlePayment} disabled={saving}>{saving?"...":"Record Payment"}</button></>}>
          <div style={{ marginBottom:"14px", padding:"10px 12px", background:"var(--gray-50)", borderRadius:"8px", fontSize:"13px" }}>
            Balance Due: <strong style={{ color:"var(--danger)" }}>₹{showPay.balanceDue?.toLocaleString("en-IN")}</strong>
          </div>
          <div className="form-group"><label className="form-label">Amount (₹) *</label><input type="number" className="form-control" value={payForm.amount} onChange={e => setPayForm({...payForm, amount:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" value={payForm.date} onChange={e => setPayForm({...payForm, date:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Note</label><input className="form-control" value={payForm.note} onChange={e => setPayForm({...payForm, note:e.target.value})} /></div>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <Modal title={showDetail.name} onClose={() => setShowDetail(null)}>
          <div style={{ fontSize:"14px" }}>
            {[["Trade",showDetail.trade],["Company",showDetail.company||"—"],["Phone",showDetail.phone||"—"],["Scope",showDetail.workScope||"—"],["Contract",`₹${showDetail.contractAmount?.toLocaleString("en-IN")}`],["Paid",`₹${showDetail.totalPaid?.toLocaleString("en-IN")}`],["Balance",`₹${showDetail.balanceDue?.toLocaleString("en-IN")}`],["Status",showDetail.status]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--gray-100)" }}>
                <span style={{ color:"var(--gray-400)" }}>{k}</span><span style={{ fontWeight:500 }}>{v}</span>
              </div>
            ))}
            {showDetail.payments?.length > 0 && (
              <div style={{ marginTop:"14px" }}>
                <div style={{ fontSize:"12px", fontWeight:600, color:"var(--gray-400)", textTransform:"uppercase", marginBottom:"8px" }}>Payment History</div>
                {showDetail.payments.map((p,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"5px 0", borderBottom:"1px solid var(--gray-50)" }}>
                    <span>{p.date}</span><span style={{ fontWeight:600, color:"var(--success)" }}>₹{p.amount?.toLocaleString("en-IN")}</span><span style={{ color:"var(--gray-400)" }}>{p.note||""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SubcontractorPage;
