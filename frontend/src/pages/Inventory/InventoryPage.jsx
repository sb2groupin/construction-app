import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { inventoryAPI } from "../../api/extra.api";
import { projectAPI } from "../../api/project.api";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import { getAssetUrl } from "../../utils/url.utils";
import toast from "react-hot-toast";

const TABS = ["stock", "transactions", "requests"];

const InventoryPage = () => {
  const { t } = useTranslation();
  const [tab,       setTab]      = useState("stock");
  const [items,     setItems]    = useState([]);
  const [txns,      setTxns]     = useState([]);
  const [requests,  setRequests] = useState([]);
  const [projects,  setProjects] = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [lowAlerts, setLowAlerts]= useState(0);
  const [selectedProject, setSelectedProject] = useState("");
  const [showAdd,   setShowAdd]  = useState(false);
  const [showStock, setShowStock]= useState(null); // {item, type: "receive"|"use"}
  const [showReq,   setShowReq]  = useState(false);
  const [saving,    setSaving]   = useState(false);
  const billRef = useRef();

  const [addForm, setAddForm]   = useState({ projectId: "", materialName: "", unit: "bags", lowStockThreshold: 50, vendorName: "", unitPrice: "" });
  const [stockForm, setStockForm] = useState({ quantity: "", notes: "" });
  const [reqForm,  setReqForm]  = useState({ projectId: "", materialName: "", quantity: "", unit: "bags", reason: "" });

  useEffect(() => {
    projectAPI.getAll().then(res => {
      const p = res.data.projects || [];
      setProjects(p);
      if (p.length) { setSelectedProject(p[0]._id); setAddForm(f => ({ ...f, projectId: p[0]._id })); setReqForm(f => ({ ...f, projectId: p[0]._id })); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [selectedProject, tab]);

  const load = async () => {
    const params = selectedProject ? { projectId: selectedProject } : {};
    try {
      if (tab === "stock") {
        const res = await inventoryAPI.getAll(params);
        setItems(res.data.items || []);
        setLowAlerts(res.data.lowStockAlerts || 0);
      } else if (tab === "transactions") {
        const res = await inventoryAPI.getTransactions(params);
        setTxns(res.data.transactions || []);
      } else {
        const res = await inventoryAPI.getRequests(params);
        setRequests(res.data.requests || []);
      }
    } catch { toast.error(t("loadError")); }
  };

  const handleAddMaterial = async () => {
    if (!addForm.projectId || !addForm.materialName || !addForm.unit) { toast.error(t("requiredFields")); return; }
    setSaving(true);
    try { await inventoryAPI.add(addForm); toast.success(t("materialAdded")); setShowAdd(false); load(); }
    catch (err) { toast.error(err.message || t("saveFailed")); }
    finally { setSaving(false); }
  };

  const handleStockEntry = async () => {
    if (!stockForm.quantity) { toast.error(t("quantityRequired")); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("inventoryId", showStock.item._id);
    fd.append("quantity", stockForm.quantity);
    fd.append("notes", stockForm.notes);
    if (billRef.current?.files[0]) fd.append("bill", billRef.current.files[0]);
    try {
      if (showStock.type === "receive") { const r = await inventoryAPI.receive(fd); toast.success(r.message); }
      else { const r = await inventoryAPI.use({ inventoryId: showStock.item._id, quantity: parseFloat(stockForm.quantity), notes: stockForm.notes }); if (r.data.lowStockAlert) toast("⚠️ " + r.message, { icon: "⚠️" }); else toast.success(r.message); }
      setShowStock(null); setStockForm({ quantity: "", notes: "" }); load();
    } catch (err) { toast.error(err.message || t("saveFailed")); }
    finally { setSaving(false); }
  };

  const handleRequest = async () => {
    if (!reqForm.projectId || !reqForm.materialName || !reqForm.quantity) { toast.error(t("requiredFields")); return; }
    setSaving(true);
    try { await inventoryAPI.createRequest(reqForm); toast.success(t("requestSubmitted")); setShowReq(false); load(); }
    catch (err) { toast.error(err.message || t("saveFailed")); }
    finally { setSaving(false); }
  };

  const reviewReq = async (id, action) => {
    try { await inventoryAPI.reviewRequest(id, { action }); toast.success(`${t("requestApproved")} ${action}`); load(); }
    catch { toast.error(t("reviewFailed")); }
  };

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("inventoryManagement")}</h1>
          <p className="page-subtitle">{t("inventorySubtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-outline" onClick={() => setShowReq(true)}>{t("requestMaterialBtn")}</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>{t("addMaterialBtn")}</button>
        </div>
      </div>

      {lowAlerts > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px", color: "#dc2626", display: "flex", gap: "8px", alignItems: "center" }}>
          ⚠️ <strong>{lowAlerts} {t("materialsLowStock")}</strong>
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
        {TABS.map(tabName => (
          <button key={tabName} onClick={() => setTab(tabName)} className="btn btn-sm"
            style={{ background: tab === tabName ? "var(--primary)" : "var(--gray-100)", color: tab === tabName ? "white" : "var(--gray-600)", border: "none", textTransform: "capitalize" }}>
            {tabName === "stock" ? <>{t("stockTab")}</> : tabName === "transactions" ? <>{t("transactionsTab")}</> : <>{t("requestsTab")}</>}
          </button>
        ))}
        <select className="form-control" style={{ width: "auto", marginLeft: "auto" }} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
          <option value="">{t("allSites")}</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {/* Stock Tab */}
      {tab === "stock" && (
        <div className="card">
          {items.length === 0 ? (
            <div className="empty-state"><span style={{ fontSize: "36px" }}>📦</span><p>{t("noMaterialAdded")}</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>{t("materialHeader")}</th><th>{t("stockHeader")}</th><th>{t("unitPriceHeader")}</th><th>{t("totalValueHeader")}</th><th>{t("vendorHeader")}</th><th>{t("statusHeader")}</th><th>{t("actionsHeader")}</th></tr></thead>
                <tbody>
                  {items.map(item => {
                    const isLow = item.currentStock <= item.lowStockThreshold;
                    return (
                      <tr key={item._id}>
                        <td style={{ fontWeight: 500 }}>{item.materialName}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: isLow ? "var(--danger)" : "var(--success)", fontSize: "15px" }}>{item.currentStock}</span>
                          <span style={{ color: "var(--gray-400)", fontSize: "12px" }}> {item.unit}</span>
                          <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>min: {item.lowStockThreshold}</div>
                        </td>
                        <td>₹{item.unitPrice || "—"}</td>
                        <td>₹{(item.totalValue || 0).toLocaleString("en-IN")}</td>
                        <td style={{ fontSize: "13px", color: "var(--gray-400)" }}>{item.vendorName || "—"}</td>
                        <td>{isLow ? <Badge type="danger">{t("lowStockBadge")}</Badge> : <Badge type="success">{t("okBadge")}</Badge>}</td>
                        <td>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button className="btn btn-success btn-sm" onClick={() => { setShowStock({ item, type: "receive" }); setStockForm({ quantity: "", notes: "" }); }}>+</button>
                            <button className="btn btn-danger btn-sm" onClick={() => { setShowStock({ item, type: "use" }); setStockForm({ quantity: "", notes: "" }); }}>-</button>
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
      )}

      {/* Transactions Tab */}
      {tab === "transactions" && (
        <div className="card">
          {txns.length === 0 ? <div className="empty-state"><span style={{ fontSize: "36px" }}>📊</span><p>{t("noTransaction")}</p></div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>{t("dateHeader")}</th><th>{t("typeHeader")}</th><th>{t("quantityHeader")}</th><th>{t("byHeader")}</th><th>{t("notesHeader")}</th><th>{t("billHeader")}</th></tr></thead>
                <tbody>
                  {txns.map(txn => (
                    <tr key={txn._id}>
                      <td style={{ fontSize: "12px" }}>{new Date(txn.createdAt).toLocaleDateString("en-IN")}</td>
                      <td><Badge type={txn.type === "received" ? "success" : "warning"}>{txn.type === "received" ? t("receivedBadge") : t("usedBadge")}</Badge></td>
                      <td style={{ fontWeight: 600 }}>{txn.quantity}</td>
                      <td style={{ fontSize: "13px" }}>{txn.recordedBy}</td>
                      <td style={{ fontSize: "12px", color: "var(--gray-400)" }}>{txn.notes || "—"}</td>
                      <td>{txn.billPhoto ? <a href={getAssetUrl(txn.billPhoto)} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--primary)" }}>{t("viewLink")}</a> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {tab === "requests" && (
        <div className="card">
          {requests.length === 0 ? <div className="empty-state"><span style={{ fontSize: "36px" }}>📋</span><p>{t("noRequest")}</p></div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>{t("materialHeader")}</th><th>{t("qtyHeader")}</th><th>{t("byHeader")}</th><th>{t("reasonHeader")}</th><th>{t("statusHeader")}</th><th>{t("actionsHeader")}</th></tr></thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 500 }}>{r.materialName}</td>
                      <td>{r.quantity} {r.unit}</td>
                      <td style={{ fontSize: "12px" }}>{r.requestedBy}</td>
                      <td style={{ fontSize: "12px", color: "var(--gray-400)", maxWidth: "160px" }}>{r.reason || "—"}</td>
                      <td><Badge type={r.status === "Approved" ? "success" : r.status === "Rejected" ? "danger" : "warning"}>{r.status}</Badge></td>
                      <td>
                        {r.status === "Pending" && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button className="btn btn-success btn-sm" onClick={() => reviewReq(r._id, "Approved")}>✅</button>
                            <button className="btn btn-danger btn-sm" onClick={() => reviewReq(r._id, "Rejected")}>❌</button>
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
      )}

      {/* Add Material Modal */}
      {showAdd && (
        <Modal title={t("addMaterialModal")} onClose={() => setShowAdd(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowAdd(false)}>{t("cancelBtn")}</button><button className="btn btn-primary" onClick={handleAddMaterial} disabled={saving}>{saving ? "..." : t("addBtn")}</button></>}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t("siteLabel")} *</label>
              <select className="form-control" value={addForm.projectId} onChange={e => setAddForm({ ...addForm, projectId: e.target.value })}>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("materialNameLabel")} *</label><input className="form-control" placeholder="Cement, Steel, Sand..." value={addForm.materialName} onChange={e => setAddForm({ ...addForm, materialName: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">{t("unitLabel")} *</label>
              <select className="form-control" value={addForm.unit} onChange={e => setAddForm({ ...addForm, unit: e.target.value })}>
                {["bags","MT","CFT","pieces","litre","kg","sqft"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("lowStockAlertLabel")}</label><input type="number" className="form-control" value={addForm.lowStockThreshold} onChange={e => setAddForm({ ...addForm, lowStockThreshold: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">{t("vendorLabel")}</label><input className="form-control" placeholder="Vendor name" value={addForm.vendorName} onChange={e => setAddForm({ ...addForm, vendorName: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">{t("unitPriceLabel")}</label><input type="number" className="form-control" placeholder="0" value={addForm.unitPrice} onChange={e => setAddForm({ ...addForm, unitPrice: e.target.value })} /></div>
          </div>
        </Modal>
      )}

      {/* Stock Entry Modal */}
      {showStock && (
        <Modal title={showStock.type === "receive" ? `📥 ${t("receiveLabel")} — ${showStock.item.materialName}` : `📤 ${t("useLabel")} — ${showStock.item.materialName}`}
          onClose={() => setShowStock(null)}
          footer={<><button className="btn btn-outline" onClick={() => setShowStock(null)}>{t("cancelBtn")}</button><button className={`btn ${showStock.type === "receive" ? "btn-success" : "btn-danger"}`} onClick={handleStockEntry} disabled={saving}>{saving ? "..." : t("confirmBtn")}</button></>}>
          <p style={{ fontSize: "13px", color: "var(--gray-400)", marginBottom: "14px" }}>{t("currentStockLabel")} <strong>{showStock.item.currentStock} {showStock.item.unit}</strong></p>
          <div className="form-group"><label className="form-label">{t("quantityLabel")} *</label><input type="number" className="form-control" placeholder="0" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">{t("notesLabel")}</label><input className="form-control" placeholder="Optional..." value={stockForm.notes} onChange={e => setStockForm({ ...stockForm, notes: e.target.value })} /></div>
          {showStock.type === "receive" && <div className="form-group"><label className="form-label">{t("billPhotoLabel")}</label><input ref={billRef} type="file" accept="image/*" className="form-control" /></div>}
        </Modal>
      )}

      {/* Request Modal */}
      {showReq && (
        <Modal title={t("requestMaterialBtn")} onClose={() => setShowReq(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowReq(false)}>{t("cancelBtn")}</button><button className="btn btn-primary" onClick={handleRequest} disabled={saving}>{saving ? "..." : t("submitRequestBtn")}</button></>}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t("siteLabel")} *</label>
              <select className="form-control" value={reqForm.projectId} onChange={e => setReqForm({ ...reqForm, projectId: e.target.value })}>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("materialHeader")} *</label><input className="form-control" placeholder="Cement, Steel..." value={reqForm.materialName} onChange={e => setReqForm({ ...reqForm, materialName: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">{t("quantityLabel")} *</label><input type="number" className="form-control" value={reqForm.quantity} onChange={e => setReqForm({ ...reqForm, quantity: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">{t("unitLabel")}</label>
              <select className="form-control" value={reqForm.unit} onChange={e => setReqForm({ ...reqForm, unit: e.target.value })}>
                {["bags","MT","CFT","pieces","litre","kg"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">{t("reasonLabel")}</label><textarea className="form-control" rows={2} placeholder="Kyun chahiye..." value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} /></div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryPage;
