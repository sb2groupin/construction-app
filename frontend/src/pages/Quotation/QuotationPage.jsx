import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { quotationAPI } from "../../api/quotation.api";
import { projectAPI } from "../../api/project.api";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

const STATUS_COLOR = { Draft: "gray", Sent: "primary", Accepted: "success", Rejected: "danger", Active: "success", Completed: "primary", Terminated: "danger" };

const EMPTY_Q = {
  clientName: "", clientPhone: "", clientEmail: "", clientAddress: "", siteName: "",
  projectId: "", validityDate: "", gstPercent: 18, termsConditions:
    "1. Payment to be made within 30 days of invoice.\n2. Material cost extra unless specified.\n3. Prices valid for 30 days.", notes: "",
  lineItems: [{ description: "", quantity: 1, unit: "Nos", rate: "" }],
};

const QuotationPage = () => {
  const { t } = useTranslation();
  const [tab,         setTab]        = useState("quotations");
  const [quotations,  setQuotations] = useState([]);
  const [agreements,  setAgreements] = useState([]);
  const [projects,    setProjects]   = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [showCreate,  setShowCreate] = useState(false);
  const [showView,    setShowView]   = useState(null);
  const [showConvert, setShowConvert]= useState(null);
  const [showSign,    setShowSign]   = useState(null);
  const [saving,      setSaving]     = useState(false);
  const [form,        setForm]       = useState(EMPTY_Q);
  const [convForm,    setConvForm]   = useState({ projectScope: "", startDate: "", endDate: "", paymentTerms: "", penaltyClause: "" });
  const [signName,    setSignName]   = useState("");

  useEffect(() => {
    Promise.all([quotationAPI.getAll(), quotationAPI.getAllAgreements(), projectAPI.getAll()])
      .then(([q, a, p]) => { setQuotations(q.data.quotations || []); setAgreements(a.data.agreements || []); setProjects(p.data.projects || []); })
      .catch(() => toast.error(t("loadError")))
      .finally(() => setLoading(false));
  }, []);

  const reload = async () => {
    const [q, a] = await Promise.all([quotationAPI.getAll(), quotationAPI.getAllAgreements()]);
    setQuotations(q.data.quotations || []);
    setAgreements(a.data.agreements || []);
  };

  const addLineItem = () => setForm(f => ({ ...f, lineItems: [...f.lineItems, { description: "", quantity: 1, unit: "Nos", rate: "" }] }));
  const removeLineItem = (i) => setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) }));
  const updateLine = (i, key, val) => setForm(f => ({ ...f, lineItems: f.lineItems.map((item, idx) => idx === i ? { ...item, [key]: val } : item) }));

  const subtotal   = form.lineItems.reduce((s, l) => s + ((parseFloat(l.quantity) || 0) * (parseFloat(l.rate) || 0)), 0);
  const gstAmount  = subtotal * (parseFloat(form.gstPercent) || 0) / 100;
  const totalAmount= subtotal + gstAmount;

  const handleCreate = async () => {
    if (!form.clientName || !form.lineItems.some(l => l.description && l.rate)) { toast.error(t("clientLineItemRequired")); return; }
    setSaving(true);
    try {
      await quotationAPI.create(form);
      toast.success(t("quotationCreated"));
      setShowCreate(false);
      setForm(EMPTY_Q);
      reload();
    } catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try { await quotationAPI.update(id, { status }); toast.success(t("statusUpdated")); reload(); }
    catch { toast.error(t("updateFailed")); }
  };

  const handleConvert = async () => {
    if (!convForm.projectScope) { toast.error(t("projectScopeRequired")); return; }
    setSaving(true);
    try {
      await quotationAPI.toAgreement(showConvert._id, convForm);
      toast.success(t("agreementCreated"));
      setShowConvert(null);
      setTab("agreements");
      reload();
    } catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const handleSign = async () => {
    if (!signName) { toast.error(t("clientNameRequired")); return; }
    try {
      await quotationAPI.signAgreement(showSign._id, { clientSignName: signName });
      toast.success(t("agreementSigned"));
      setShowSign(null);
      reload();
    } catch { toast.error(t("saveError")); }
  };

  const deleteQ = async (id) => {
    if (!confirm(t("confirmDelete"))) return;
    try { await quotationAPI.remove(id); toast.success(t("deleteSuccess")); reload(); }
    catch { toast.error(t("deleteError")); }
  };

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("quotationsAgreements")}</h1>
          <p className="page-subtitle">{t("quotationsSubtitle")}</p>
        </div>
        {tab === "quotations" && <button className="btn btn-primary" onClick={() => { setForm(EMPTY_Q); setShowCreate(true); }}>+ New Quotation</button>}
      </div>

      {/* Summary pills */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[["Draft","gray"],["Sent","primary"],["Accepted","success"],["Rejected","danger"]].map(([s, t]) => (
          <div key={s} style={{ padding: "6px 14px", background: "var(--gray-50)", borderRadius: "10px", fontSize: "13px" }}>
            <Badge type={t}>{s}</Badge>
            <span style={{ marginLeft: "6px", fontWeight: 600 }}>{quotations.filter(q => q.status === s).length}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
        {[["quotations","📝 Quotations"],["agreements","📋 Agreements"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="btn btn-sm"
            style={{ background: tab === id ? "var(--primary)" : "var(--gray-100)", color: tab === id ? "white" : "var(--gray-600)", border: "none" }}>
            {label} ({id === "quotations" ? quotations.length : agreements.length})
          </button>
        ))}
      </div>

      {/* Quotations list */}
      {tab === "quotations" && (
        <div className="card">
          {quotations.length === 0 ? (
            <div className="empty-state"><span style={{ fontSize: "40px" }}>📝</span><p>Koi quotation nahi — pehli quote banao</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Number</th><th>Client</th><th>Site</th><th>Total</th><th>Valid Till</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {quotations.map(q => (
                    <tr key={q._id}>
                      <td style={{ fontFamily: "monospace", fontWeight: 600, fontSize: "13px" }}>{q.quotationNumber}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{q.clientName}</div>
                        {q.clientPhone && <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>{q.clientPhone}</div>}
                      </td>
                      <td style={{ fontSize: "13px" }}>{q.siteName || q.projectId?.name || "—"}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--success)" }}>₹{q.totalAmount.toLocaleString("en-IN")}</div>
                        {q.gstPercent > 0 && <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>incl. {q.gstPercent}% GST</div>}
                      </td>
                      <td style={{ fontSize: "12px", color: q.validityDate && new Date(q.validityDate) < new Date() ? "var(--danger)" : "var(--gray-600)" }}>
                        {q.validityDate ? new Date(q.validityDate).toLocaleDateString("en-IN") : "—"}
                        {q.validityDate && new Date(q.validityDate) < new Date() && <div style={{ fontSize: "10px" }}>Expired</div>}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <Badge type={STATUS_COLOR[q.status]}>{q.status}</Badge>
                          {q.status === "Draft" && (
                            <select style={{ fontSize: "10px", border: "1px solid var(--gray-200)", borderRadius: "4px", padding: "1px 4px" }}
                              onChange={e => e.target.value && updateStatus(q._id, e.target.value)} defaultValue="">
                              <option value="">Update status</option>
                              <option value="Sent">Mark Sent</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          <button className="btn btn-outline btn-sm" onClick={() => setShowView(q)}>👁️</button>
                          {q.status !== "Rejected" && (
                            <button className="btn btn-success btn-sm" onClick={() => { setShowConvert(q); setConvForm({ projectScope: q.siteName || "", startDate: "", endDate: "", paymentTerms: "", penaltyClause: "" }); }} title="Convert to Agreement">📋</button>
                          )}
                          {q.status === "Draft" && <button className="btn btn-danger btn-sm" onClick={() => deleteQ(q._id)}>🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Agreements list */}
      {tab === "agreements" && (
        <div className="card">
          {agreements.length === 0 ? (
            <div className="empty-state"><span style={{ fontSize: "40px" }}>📋</span><p>Koi agreement nahi</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Number</th><th>Client</th><th>Scope</th><th>Amount</th><th>Period</th><th>Signed</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {agreements.map(a => (
                    <tr key={a._id}>
                      <td style={{ fontFamily: "monospace", fontWeight: 600, fontSize: "13px" }}>{a.agreementNumber}</td>
                      <td style={{ fontWeight: 500 }}>{a.clientName}</td>
                      <td style={{ fontSize: "13px", maxWidth: "180px" }}>{a.projectScope?.slice(0, 60)}{a.projectScope?.length > 60 ? "..." : ""}</td>
                      <td style={{ fontWeight: 700, color: "var(--success)" }}>₹{(a.totalAmount || 0).toLocaleString("en-IN")}</td>
                      <td style={{ fontSize: "12px" }}>
                        {a.startDate ? new Date(a.startDate).toLocaleDateString("en-IN") : "—"} →
                        {a.endDate   ? new Date(a.endDate).toLocaleDateString("en-IN")   : "—"}
                      </td>
                      <td>
                        {a.clientSignName
                          ? <div style={{ fontSize: "12px", color: "var(--success)" }}>✅ {a.clientSignName}<br/><span style={{ fontSize: "10px", color: "var(--gray-400)" }}>{a.clientSignDate ? new Date(a.clientSignDate).toLocaleDateString("en-IN") : ""}</span></div>
                          : <button className="btn btn-outline btn-sm" onClick={() => { setShowSign(a); setSignName(""); }}>✍️ Get Sign</button>}
                      </td>
                      <td><Badge type={STATUS_COLOR[a.status]}>{a.status}</Badge></td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowView(a)}>👁️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE QUOTATION MODAL */}
      {showCreate && (
        <Modal title="New Quotation" onClose={() => setShowCreate(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? "..." : "Create Quotation"}</button></>}>
          <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "4px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "10px" }}>Client Details</div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">{t("clientNameField")} *</label><input className="form-control" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">{t("phoneFieldLabel")}</label><input className="form-control" value={form.clientPhone} onChange={e => setForm({ ...form, clientPhone: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">{t("siteNameField")}</label><input className="form-control" placeholder="Site ka naam" value={form.siteName} onChange={e => setForm({ ...form, siteName: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">{t("linkToProject")}</label>
                <select className="form-control" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
                  <option value="">No project</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">{t("gstPercent")}</label><input type="number" className="form-control" min="0" max="28" value={form.gstPercent} onChange={e => setForm({ ...form, gstPercent: parseFloat(e.target.value) || 0 })} /></div>
              <div className="form-group"><label className="form-label">{t("validTill")}</label><input type="date" className="form-control" value={form.validityDate} onChange={e => setForm({ ...form, validityDate: e.target.value })} /></div>
            </div>

            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: ".04em", margin: "14px 0 10px" }}>Line Items</div>
            {form.lineItems.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1.5fr auto", gap: "6px", marginBottom: "8px", alignItems: "center" }}>
                <input className="form-control" placeholder="Work description" value={item.description} onChange={e => updateLine(i, "description", e.target.value)} style={{ fontSize: "12px" }} />
                <input type="number" className="form-control" placeholder="Qty" value={item.quantity} onChange={e => updateLine(i, "quantity", e.target.value)} style={{ fontSize: "12px" }} />
                <select className="form-control" value={item.unit} onChange={e => updateLine(i, "unit", e.target.value)} style={{ fontSize: "12px" }}>
                  {["Nos","Sqft","RFt","CFT","MT","Bags","LS","Hours"].map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="number" className="form-control" placeholder="Rate ₹" value={item.rate} onChange={e => updateLine(i, "rate", e.target.value)} style={{ fontSize: "12px" }} />
                <button className="btn btn-danger btn-sm" onClick={() => removeLineItem(i)} style={{ padding: "6px 8px" }}>×</button>
              </div>
            ))}
            <button className="btn btn-outline btn-sm" onClick={addLineItem} style={{ marginBottom: "14px" }}>+ Add Line</button>

            {/* Totals */}
            <div style={{ background: "var(--gray-50)", padding: "12px", borderRadius: "8px", marginBottom: "14px" }}>
              {[["Subtotal", `₹${subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`],
                [`GST (${form.gstPercent}%)`, `₹${gstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0" }}>
                  <span style={{ color: "var(--gray-400)" }}>{k}</span><span>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 700, borderTop: "1px solid var(--gray-200)", marginTop: "6px", paddingTop: "6px" }}>
                <span>Total</span><span style={{ color: "var(--success)" }}>₹{totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="form-group"><label className="form-label">{t("termsConditions")}</label><textarea className="form-control" rows={4} value={form.termsConditions} onChange={e => setForm({ ...form, termsConditions: e.target.value })} /></div>
          </div>
        </Modal>
      )}

      {/* VIEW MODAL */}
      {showView && (
        <Modal title={showView.quotationNumber || showView.agreementNumber || "Details"} onClose={() => setShowView(null)}>
          <div style={{ maxHeight: "65vh", overflowY: "auto" }}>
            {showView.lineItems && (
              <>
                <div style={{ fontSize: "13px", marginBottom: "12px" }}>
                  <strong>Client:</strong> {showView.clientName} {showView.clientPhone && `· ${showView.clientPhone}`}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "14px" }}>
                  <thead><tr style={{ background: "var(--gray-50)" }}>
                    <th style={{ padding: "8px", textAlign: "left", border: "1px solid var(--gray-200)" }}>Description</th>
                    <th style={{ padding: "8px", textAlign: "right", border: "1px solid var(--gray-200)" }}>Qty</th>
                    <th style={{ padding: "8px", textAlign: "right", border: "1px solid var(--gray-200)" }}>Rate</th>
                    <th style={{ padding: "8px", textAlign: "right", border: "1px solid var(--gray-200)" }}>Amount</th>
                  </tr></thead>
                  <tbody>
                    {showView.lineItems.map((l, i) => (
                      <tr key={i}><td style={{ padding: "7px 8px", border: "1px solid var(--gray-200)" }}>{l.description}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", border: "1px solid var(--gray-200)" }}>{l.quantity} {l.unit}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", border: "1px solid var(--gray-200)" }}>₹{l.rate}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", border: "1px solid var(--gray-200)", fontWeight: 500 }}>₹{((l.quantity || 0) * (l.rate || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: "right", fontSize: "13px", marginBottom: "14px" }}>
                  Subtotal: ₹{showView.subtotal?.toLocaleString("en-IN")}<br />
                  GST ({showView.gstPercent}%): ₹{showView.gstAmount?.toLocaleString("en-IN")}<br />
                  <strong style={{ fontSize: "16px" }}>Total: ₹{showView.totalAmount?.toLocaleString("en-IN")}</strong>
                </div>
              </>
            )}
            {showView.termsConditions && <div style={{ fontSize: "12px", color: "var(--gray-600)", whiteSpace: "pre-wrap", background: "var(--gray-50)", padding: "10px", borderRadius: "6px" }}>{showView.termsConditions}</div>}
            {showView.projectScope && <div style={{ fontSize: "13px", marginTop: "12px" }}><strong>Scope:</strong> {showView.projectScope}</div>}
            {showView.paymentTerms && <div style={{ fontSize: "13px", marginTop: "8px" }}><strong>Payment Terms:</strong> {showView.paymentTerms}</div>}
            {showView.clientSignName && <div style={{ marginTop: "14px", padding: "10px", background: "#F0FDF4", borderRadius: "8px", fontSize: "13px" }}>✅ Signed by: {showView.clientSignName} on {new Date(showView.clientSignDate).toLocaleDateString("en-IN")}</div>}
          </div>
        </Modal>
      )}

      {/* CONVERT TO AGREEMENT MODAL */}
      {showConvert && (
        <Modal title={`Convert to Agreement — ${showConvert.quotationNumber}`} onClose={() => setShowConvert(null)}
          footer={<><button className="btn btn-outline" onClick={() => setShowConvert(null)}>Cancel</button><button className="btn btn-success" onClick={handleConvert} disabled={saving}>{saving ? "..." : "Create Agreement"}</button></>}>
          <div className="form-group"><label className="form-label">{t("projectScope")} *</label><textarea className="form-control" rows={3} placeholder="Kya kaam hoga..." value={convForm.projectScope} onChange={e => setConvForm({ ...convForm, projectScope: e.target.value })} /></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t("startDateField")}</label><input type="date" className="form-control" value={convForm.startDate} onChange={e => setConvForm({ ...convForm, startDate: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">{t("endDateField")}</label><input type="date" className="form-control" value={convForm.endDate} onChange={e => setConvForm({ ...convForm, endDate: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">{t("paymentTerms")}</label><textarea className="form-control" rows={2} placeholder="Kab aur kaise payment hogi" value={convForm.paymentTerms} onChange={e => setConvForm({ ...convForm, paymentTerms: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">{t("penaltyClause")}</label><textarea className="form-control" rows={2} placeholder="Late delivery penalty..." value={convForm.penaltyClause} onChange={e => setConvForm({ ...convForm, penaltyClause: e.target.value })} /></div>
        </Modal>
      )}

      {/* SIGN AGREEMENT MODAL */}
      {showSign && (
        <Modal title="Client Signature" onClose={() => setShowSign(null)}
          footer={<><button className="btn btn-outline" onClick={() => setShowSign(null)}>Cancel</button><button className="btn btn-success" onClick={handleSign}>✅ Confirm Signature</button></>}>
          <p style={{ fontSize: "13px", color: "var(--gray-400)", marginBottom: "14px" }}>{showSign.agreementNumber} · {showSign.clientName}</p>
          <div className="form-group">
            <label className="form-label">{t("clientFullNameDigital")} *</label>
            <input className="form-control" placeholder="Client ka poora naam" value={signName} onChange={e => setSignName(e.target.value)} />
          </div>
          <div style={{ fontSize: "11px", color: "var(--gray-400)", padding: "8px", background: "var(--gray-50)", borderRadius: "6px" }}>
            Client ka naam daalne se agreement signed maana jayega. Date auto-save hogi.
          </div>
        </Modal>
      )}
    </div>
  );
};

export default QuotationPage;
