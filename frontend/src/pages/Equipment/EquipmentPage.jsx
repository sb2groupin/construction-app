import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { equipmentAPI } from "../../api/extra.api";
import { projectAPI } from "../../api/project.api";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

const STATUS_COLOR = { Active:"success", Idle:"gray", "Under Maintenance":"warning", Retired:"danger" };
const TYPES = ["JCB","Mixer","Generator","Vibrator","Crane","Truck","Compressor","Welding Machine","Other"];

const EquipmentPage = () => {
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [showUsage, setShowUsage] = useState(null);
  const [showSvc,   setShowSvc]   = useState(null);
  const [showDetail,setShowDetail]= useState(null);
  const [saving,    setSaving]    = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm]       = useState({ name:"", type:"JCB", registrationNo:"", projectId:"", lastServiceDate:"", nextServiceDate:"" });
  const [usageForm, setUsage] = useState({ date:today, hoursUsed:"", operatorName:"", fuelCost:"", notes:"" });
  const [svcForm,   setSvc]   = useState({ nextServiceDate:"", notes:"" });

  useEffect(() => {
    Promise.all([equipmentAPI.getAll(), projectAPI.getAll()])
      .then(([eRes, pRes]) => { setEquipment(eRes.data.equipment||[]); setProjects(pRes.data.projects||[]); })
      .catch(() => toast.error(t("loadError")))
      .finally(() => setLoading(false));
  }, []);

  const load = async () => {
    const res = await equipmentAPI.getAll();
    setEquipment(res.data.equipment||[]);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error(t("nameRequired")); return; }
    setSaving(true);
    try { await equipmentAPI.create(form); toast.success(t("equipmentAdded")); setShowAdd(false); load(); }
    catch (err) { toast.error(err.message||t("saveError")); }
    finally { setSaving(false); }
  };

  const handleUsage = async () => {
    if (!usageForm.hoursUsed) { toast.error(t("hoursRequired")); return; }
    setSaving(true);
    try { await equipmentAPI.addUsage(showUsage._id, usageForm); toast.success(t("usageLogged")); setShowUsage(null); load(); }
    catch (err) { toast.error(err.message||"Failed"); }
    finally { setSaving(false); }
  };

  const handleService = async () => {
    setSaving(true);
    try { await equipmentAPI.markService(showSvc._id, svcForm); toast.success("Service recorded ✅"); setShowSvc(null); load(); }
    catch (err) { toast.error(err.message||"Failed"); }
    finally { setSaving(false); }
  };

  const handleRemove = async (id, name) => {
    if (!confirm(`${name} remove karna chahte ho?`)) return;
    try { await equipmentAPI.remove(id); toast.success("Removed"); load(); }
    catch { toast.error("Failed"); }
  };

  const overdueCount = equipment.filter(e => e.nextServiceDate && e.nextServiceDate <= today && e.status !== "Under Maintenance").length;

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">{t("equipmentMachinery")}</h1><p className="page-subtitle">{t("equipmentSubtitle")}</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name:"", type:"JCB", registrationNo:"", projectId:"", lastServiceDate:"", nextServiceDate:"" }); setShowAdd(true); }}>{t("addEquipmentBtn")}</button>
      </div>

      {overdueCount > 0 && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"8px", padding:"10px 14px", marginBottom:"14px", fontSize:"13px", color:"#dc2626" }}>
          ⚠️ <strong>{overdueCount}</strong> {t("serviceOverdue")}
        </div>
      )}

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"16px" }}>
        {[
          { label:t("totalEquipmentCard"), value:equipment.length, color:"var(--primary)" },
          { label:t("activeCard"),          value:equipment.filter(e=>e.status==="Active").length, color:"var(--success)" },
          { label:t("totalHoursCard"),     value:equipment.reduce((s,e)=>s+(e.totalHours||0),0)+"h", color:"var(--primary)" },
          { label:t("totalFuelCostCard"), value:`₹${equipment.reduce((s,e)=>s+(e.totalFuelCost||0),0).toLocaleString("en-IN")}`, color:"var(--warning)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"18px", fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:"12px", color:"var(--gray-400)", marginTop:"4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        {equipment.length === 0 ? (
          <div className="empty-state"><span style={{ fontSize:"40px" }}>🚜</span><p>{t("noEquipment")}</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t("equipmentHeader")}</th><th>{t("siteHeader")}</th><th>{t("totalHoursHeader")}</th><th>{t("fuelCostHeader")}</th><th>{t("lastServiceHeader")}</th><th>{t("nextServiceHeader")}</th><th>{t("statusHeader")}</th><th>{t("actionsHeader")}</th></tr></thead>
              <tbody>
                {equipment.map(e => {
                  const isOverdue = e.nextServiceDate && e.nextServiceDate <= today && e.status !== "Under Maintenance";
                  return (
                    <tr key={e._id}>
                      <td>
                        <div style={{ fontWeight:500 }}>{e.name}</div>
                        <div style={{ fontSize:"11px", color:"var(--gray-400)" }}>{e.type}{e.registrationNo&&` · ${e.registrationNo}`}</div>
                      </td>
                      <td style={{ fontSize:"13px" }}>{e.projectId?.name||"—"}</td>
                      <td style={{ fontWeight:600 }}>{e.totalHours}h</td>
                      <td style={{ color:"var(--warning)" }}>₹{(e.totalFuelCost||0).toLocaleString("en-IN")}</td>
                      <td style={{ fontSize:"12px" }}>{e.lastServiceDate||"—"}</td>
                      <td style={{ fontSize:"12px", color:isOverdue?"var(--danger)":"inherit", fontWeight:isOverdue?600:400 }}>
                        {e.nextServiceDate||"—"}{isOverdue&&" ⚠️"}
                      </td>
                      <td><Badge type={STATUS_COLOR[e.status]}>{e.status}</Badge></td>
                      <td>
                        <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                          <button className="btn btn-outline btn-sm" onClick={() => setShowDetail(e)}>👁️</button>
                          <button className="btn btn-primary btn-sm" onClick={() => { setShowUsage(e); setUsage({ date:today, hoursUsed:"", operatorName:"", fuelCost:"", notes:"" }); }}>{t("logUsageBtn")}</button>
                          <button className="btn btn-success btn-sm" onClick={() => { setShowSvc(e); setSvc({ nextServiceDate:"", notes:"" }); }}>🔧 {t("markServiceDone")}</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemove(e._id, e.name)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title={t("addEquipmentModal")} onClose={() => setShowAdd(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowAdd(false)}>{t("cancelBtn")}</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?"...":t("addBtn")}</button></>}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t("name")} *</label><input className="form-control" placeholder="JCB, Mixer..." value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">{t("equipmentType")}</label>
              <select className="form-control" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("registrationNo")}</label><input className="form-control" value={form.registrationNo} onChange={e=>setForm({...form,registrationNo:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">{t("siteField")}</label>
              <select className="form-control" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})}>
                <option value="">No site</option>
                {projects.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("lastServiceDate")}</label><input type="date" className="form-control" value={form.lastServiceDate} onChange={e=>setForm({...form,lastServiceDate:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">{t("nextServiceDue")}</label><input type="date" className="form-control" value={form.nextServiceDate} onChange={e=>setForm({...form,nextServiceDate:e.target.value})} /></div>
          </div>
        </Modal>
      )}

      {/* Usage Modal */}
      {showUsage && (
        <Modal title={`${t("logUsageModal")} — ${showUsage.name}`} onClose={() => setShowUsage(null)}
          footer={<><button className="btn btn-outline" onClick={() => setShowUsage(null)}>{t("cancelBtn")}</button><button className="btn btn-primary" onClick={handleUsage} disabled={saving}>{saving?"...":t("loggingUsage")}</button></>}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t("date")}</label><input type="date" className="form-control" value={usageForm.date} onChange={e=>setUsage({...usageForm,date:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">{t("hoursUsed")} *</label><input type="number" step="0.5" className="form-control" value={usageForm.hoursUsed} onChange={e=>setUsage({...usageForm,hoursUsed:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">{t("operatorName")}</label><input className="form-control" value={usageForm.operatorName} onChange={e=>setUsage({...usageForm,operatorName:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">{t("fuelCost")} (₹)</label><input type="number" className="form-control" value={usageForm.fuelCost} onChange={e=>setUsage({...usageForm,fuelCost:e.target.value})} /></div>
          </div>
          <div className="form-group"><label className="form-label">{t("notesField")}</label><input className="form-control" value={usageForm.notes} onChange={e=>setUsage({...usageForm,notes:e.target.value})} /></div>
        </Modal>
      )}

      {/* Service Modal */}
      {showSvc && (
        <Modal title={`${t("markServiceDone")} — ${showSvc.name}`} onClose={() => setShowSvc(null)}
          footer={<><button className="btn btn-outline" onClick={() => setShowSvc(null)}>{t("cancelBtn")}</button><button className="btn btn-success" onClick={handleService} disabled={saving}>{saving?"...":t("markDoneBtn")}</button></>}>
          <div className="form-group"><label className="form-label">{t("nextServiceDue")}</label><input type="date" className="form-control" value={svcForm.nextServiceDate} onChange={e=>setSvc({...svcForm,nextServiceDate:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">{t("serviceNotes")}</label><textarea className="form-control" rows={2} value={svcForm.notes} onChange={e=>setSvc({...svcForm,notes:e.target.value})} /></div>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <Modal title={showDetail.name} onClose={() => setShowDetail(null)}>
          <div style={{ fontSize:"14px" }}>
            {[[t("typeLabel"),showDetail.type],[t("registrationLabel"),showDetail.registrationNo||"—"],[t("siteLabel"),showDetail.projectId?.name||"—"],[t("totalHoursLabel"),`${showDetail.totalHours}h`],[t("totalFuelCostLabel"),`₹${(showDetail.totalFuelCost||0).toLocaleString("en-IN")}`],[t("lastServiceLabel"),showDetail.lastServiceDate||"—"],[t("nextServiceLabel"),showDetail.nextServiceDate||"—"],[t("statusLabel"),showDetail.status]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--gray-100)" }}>
                <span style={{ color:"var(--gray-400)" }}>{k}</span><span style={{ fontWeight:500 }}>{v}</span>
              </div>
            ))}
            {showDetail.usageLogs?.length > 0 && (
              <div style={{ marginTop:"14px" }}>
                <div style={{ fontSize:"12px", fontWeight:600, color:"var(--gray-400)", textTransform:"uppercase", marginBottom:"8px" }}>{t("recentUsageTitle")}</div>
                {showDetail.usageLogs.slice(-10).reverse().map((u,i) => (
                  <div key={i} style={{ display:"flex", gap:"8px", fontSize:"12px", padding:"5px 0", borderBottom:"1px solid var(--gray-50)", flexWrap:"wrap" }}>
                    <span style={{ color:"var(--gray-500)" }}>{u.date}</span>
                    <span style={{ fontWeight:500 }}>{u.hoursUsed}h</span>
                    {u.operatorName && <span style={{ color:"var(--gray-400)" }}>{u.operatorName}</span>}
                    {u.fuelCost > 0 && <span style={{ color:"var(--warning)" }}>₹{u.fuelCost}</span>}
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

export default EquipmentPage;
