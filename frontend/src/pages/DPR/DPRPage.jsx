import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { dprAPI } from "../../api/extra.api";
import { projectAPI } from "../../api/project.api";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import { getAssetUrl } from "../../utils/url.utils";
import toast from "react-hot-toast";

const WEATHER_EMOJI = { Sunny:"☀️", Cloudy:"🌥️", Rain:"🌧️", "Extreme Heat":"🔥", Foggy:"🌫️" };
const CATEGORIES = ["Excavation","Brickwork","Plaster","RCC","Finishing","Electrical","Plumbing","Other"];

const DPRPage = () => {
  const { t } = useTranslation();
  const { isAdmin, user } = useAuth();
  const [dprs,     setDprs]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showComment, setShowComment] = useState(null);
  const [comment,  setComment]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [filterMonth, setFilterMonth] = useState(thisMonth);

  const fileRef = useRef();
  const [form, setForm] = useState({
    projectId: "", workCategory: "Brickwork", description: "",
    skilledLabour: "", unskilledLabour: "", weather: "Sunny",
  });

  useEffect(() => {
    projectAPI.getAll({ status: "Active" }).then(res => {
      const p = res.data.projects || [];
      setProjects(p);
      if (p.length > 0) { setForm(f => ({ ...f, projectId: p[0]._id })); setSelectedProject(p[0]._id); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDPRs(); }, [selectedProject, filterMonth]);

  const loadDPRs = async () => {
    const [y, m] = filterMonth.split("-");
    try {
      const res = await dprAPI.getAll({ projectId: selectedProject || undefined, month: m, year: y });
      setDprs(res.data.dprs || []);
    } catch { toast.error(t("loadError")); }
  };

  const handleSubmit = async () => {
    if (!form.projectId || !form.description) { toast.error(t("projectDescriptionRequired")); return; }
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (fileRef.current?.files) [...fileRef.current.files].forEach(f => fd.append("photos", f));
    try {
      await dprAPI.submit(fd);
      toast.success(t("dprSubmitted"));
      setShowForm(false);
      loadDPRs();
    } catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const handleComment = async () => {
    if (!comment) return;
    try {
      await dprAPI.addComment(showComment._id, { comment });
      toast.success(t("commentAdded"));
      setShowComment(null); setComment(""); loadDPRs();
    } catch { toast.error(t("saveError")); }
  };

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">{t("dprPageTitle")}</h1><p className="page-subtitle">{t("dprPageSubtitle")}</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ {t("submitDprButton")}</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <label className="form-label">{t("siteLabel")}</label>
            <select className="form-control" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              <option value="">{t("allSites")}</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">{t("monthLabel")}</label>
            <input type="month" className="form-control" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <span style={{ fontSize: "13px", color: "var(--gray-400)" }}>{dprs.length} {t("dprReports")}</span>
          </div>
        </div>
      </div>

      {/* DPR Timeline */}
      {dprs.length === 0 ? (
        <div className="card"><div className="empty-state"><span style={{ fontSize: "40px" }}>📋</span><p>{t("noDprData")}</p></div></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {dprs.map(dpr => (
            <div key={dpr._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "15px" }}>{dpr.date}</span>
                    <Badge type="primary">{dpr.workCategory}</Badge>
                    <span>{WEATHER_EMOJI[dpr.weather]} {dpr.weather}</span>
                  </div>
                  <p style={{ color: "var(--gray-400)", fontSize: "12px", marginTop: "2px" }}>
                    {dpr.projectId?.name || "—"} · Submitted by {dpr.submittedBy}
                  </p>
                </div>
                {isAdmin && (
                  <button className="btn btn-outline btn-sm" onClick={() => { setShowComment(dpr); setComment(dpr.adminComment || ""); }}>
                    💬 {dpr.adminComment ? t("editComment") : t("addComment")}
                  </button>
                )}
              </div>

              <p style={{ marginTop: "10px", fontSize: "14px", color: "var(--gray-700)", lineHeight: 1.6 }}>{dpr.description}</p>

              <div style={{ display: "flex", gap: "20px", marginTop: "10px", fontSize: "13px", color: "var(--gray-600)" }}>
                <span>👷 Skilled: <strong>{dpr.skilledLabour}</strong></span>
                <span>👷 Unskilled: <strong>{dpr.unskilledLabour}</strong></span>
                <span>Total: <strong>{dpr.totalLabour}</strong></span>
              </div>

              {/* Photos */}
              {dpr.photos?.length > 0 && (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                  {dpr.photos.map((p, i) => (
                    <img key={i} src={getAssetUrl(p)} alt={`site ${i+1}`}
                      style={{ width: "90px", height: "70px", objectFit: "cover", borderRadius: "6px", cursor: "pointer" }}
                      onClick={() => window.open(getAssetUrl(p), "_blank")}
                    />
                  ))}
                </div>
              )}

              {/* Admin comment */}
              {dpr.adminComment && (
                <div style={{ marginTop: "12px", padding: "10px 12px", background: "#eff6ff", borderLeft: "3px solid var(--primary)", borderRadius: "0 6px 6px 0", fontSize: "13px" }}>
                  💬 <strong>Admin:</strong> {dpr.adminComment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit DPR Modal */}
      {showForm && (
        <Modal title={t("submitDprModal")} onClose={() => setShowForm(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>{t("cancel")}</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? t("submitting") : t("submitDprButton")}</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t("siteLabel")} *</label>
              <select className="form-control" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t("workCategoryLabel")}</label>
              <select className="form-control" value={form.workCategory} onChange={e => setForm({ ...form, workCategory: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t("skilledLabourLabel")}</label>
              <input type="number" className="form-control" placeholder="0" value={form.skilledLabour} onChange={e => setForm({ ...form, skilledLabour: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t("unskilledLabourLabel")}</label>
              <input type="number" className="form-control" placeholder="0" value={form.unskilledLabour} onChange={e => setForm({ ...form, unskilledLabour: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t("weatherLabel")}</label>
              <select className="form-control" value={form.weather} onChange={e => setForm({ ...form, weather: e.target.value })}>
                {Object.keys(WEATHER_EMOJI).map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t("dprDescriptionPlaceholder")}</label>
            <textarea className="form-control" rows={3} placeholder="Description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t("sitePhotosLabel")}</label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="form-control" />
          </div>
        </Modal>
      )}

      {/* Comment Modal */}
      {showComment && (
        <Modal title={t("adminCommentModal")} onClose={() => setShowComment(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowComment(null)}>{t("cancel")}</button>
              <button className="btn btn-primary" onClick={handleComment}>{t("save")}</button>
            </>
          }
        >
          <textarea className="form-control" rows={3} placeholder={t("commentLabel")} value={comment} onChange={e => setComment(e.target.value)} />
        </Modal>
      )}
    </div>
  );
};

export default DPRPage;
