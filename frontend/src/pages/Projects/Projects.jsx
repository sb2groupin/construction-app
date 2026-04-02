import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { projectAPI } from "../../api/project.api";
import { employeeAPI } from "../../api/employee.api";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import StatCard from "../../components/common/StatCard";
import toast from "react-hot-toast";

const STATUS_COLORS = { Active: "success", "On Hold": "warning", Completed: "primary", Cancelled: "danger" };
const EMPTY = {
  name: "", location: "", googleMapLink: "", clientName: "", clientPhone: "",
  budget: "", startDate: "", deadline: "", status: "Active",
  supervisorId: "", description: "", siteLatitude: "", siteLongitude: "", geoFenceRadius: 500,
};

const Projects = () => {
  const { t } = useTranslation();
  const [projects,  setProjects]  = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary,   setSummary]   = useState({ total: 0, active: 0, completed: 0, onHold: 0 });
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssign,setShowAssign]= useState(false);
  const [showDetail,setShowDetail]= useState(null);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [assignForm,setAssignForm]= useState({ empId: "", action: "assign" });
  const [saving,    setSaving]    = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const load = async () => {
    try {
      const [pRes, sRes, eRes] = await Promise.all([
        projectAPI.getAll(filterStatus ? { status: filterStatus } : {}),
        projectAPI.getSummary(),
        employeeAPI.getAll({ isActive: true }),
      ]);
      setProjects(pRes.data.projects || []);
      setSummary(sRes.data || {});
      setEmployees(eRes.data.employees || []);
    } catch { toast.error(t("loadError")); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (p)  => {
    setEditing(p);
    setForm({
      name: p.name, location: p.location, googleMapLink: p.googleMapLink || "",
      clientName: p.clientName || "", clientPhone: p.clientPhone || "",
      budget: p.budget || "", startDate: p.startDate?.slice(0,10) || "",
      deadline: p.deadline?.slice(0,10) || "", status: p.status,
      supervisorId: p.supervisorId || "", description: p.description || "",
      siteLatitude: p.siteLatitude || "", siteLongitude: p.siteLongitude || "",
      geoFenceRadius: p.geoFenceRadius || 500,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.location) { toast.error(t("requiredFields")); return; }
    setSaving(true);
    try {
      if (editing) {
        await projectAPI.update(editing._id, form);
        toast.success(t("updateSuccess"));
      } else {
        await projectAPI.add(form);
        toast.success(t("projectCreated"));
      }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(t("confirmDelete"))) return;
    try { await projectAPI.remove(id); toast.success(t("deleteSuccess")); load(); }
    catch { toast.error(t("deleteError")); }
  };

  const handleAssign = async () => {
    if (!assignForm.empId) { toast.error(t("selectEmployee")); return; }
    setSaving(true);
    try {
      await projectAPI.assignEmployee(showAssign._id, assignForm);
      toast.success(assignForm.action === "assign" ? t("assignSuccess") : t("unassignSuccess"));
      setShowAssign(false); load();
    } catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("projectsSites")}</h1>
          <p className="page-subtitle">{t("projectsSitesSubtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>{t("newProjectBtn")}</button>
      </div>

      {/* Summary cards */}
      <div className="stat-cards" style={{ marginBottom: "20px" }}>
        <StatCard icon="🏗️" label={t("totalSitesLabel")}   value={summary.total}     color="blue"   />
        <StatCard icon="✅" label={t("activeLabel")}         value={summary.active}    color="green"  />
        <StatCard icon="⏸️" label={t("onHoldLabel")}        value={summary.onHold}    color="orange" />
        <StatCard icon="🏁" label={t("completedLabel")}      value={summary.completed} color="blue"   />
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["", "Active", "On Hold", "Completed", "Cancelled"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="btn btn-sm"
              style={{
                background: filterStatus === s ? "var(--primary)" : "var(--gray-100)",
                color: filterStatus === s ? "white" : "var(--gray-600)",
                border: "none",
              }}
            >
              {s || t("allFilter")}
            </button>
          ))}
        </div>
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="card">
          <div className="empty-state"><span style={{ fontSize: "40px" }}>🏗️</span><p>{t("noProjects")}</p></div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {projects.map(p => {
            const budgetUsed = p.budget > 0 ? Math.min((p.amountSpent / p.budget) * 100, 100).toFixed(0) : 0;
            const isOverdue  = p.deadline && new Date(p.deadline) < new Date() && p.status === "Active";
            return (
              <div key={p._id} className="card" style={{ position: "relative" }}>
                {isOverdue && (
                  <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                    <Badge type="danger">⚠️ {t("overdueLabel")}</Badge>
                  </div>
                )}

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ flex: 1, paddingRight: "60px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>{p.name}</h3>
                    <p style={{ fontSize: "12px", color: "var(--gray-400)", marginTop: "2px" }}>📍 {p.location}</p>
                  </div>
                </div>

                <Badge type={STATUS_COLORS[p.status] || "gray"}>{p.status}</Badge>

                {/* Info rows */}
                <div style={{ margin: "12px 0", fontSize: "13px" }}>
                  {p.clientName && <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--gray-100)" }}>
                    <span style={{ color: "var(--gray-400)" }}>{t("clientLabel")}</span><span style={{ fontWeight: 500 }}>{p.clientName}</span>
                  </div>}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--gray-100)" }}>
                    <span style={{ color: "var(--gray-400)" }}>{t("employeesLabel")}</span><span style={{ fontWeight: 500 }}>{p.employeeCount} {t("assignedLabel")}</span>
                  </div>
                  {p.deadline && <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--gray-100)" }}>
                    <span style={{ color: "var(--gray-400)" }}>{t("deadlineLabel")}</span>
                    <span style={{ fontWeight: 500, color: isOverdue ? "var(--danger)" : "inherit" }}>
                      {new Date(p.deadline).toLocaleDateString("en-IN")}
                    </span>
                  </div>}
                </div>

                {/* Completion bar */}
                <div style={{ marginBottom: "4px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--gray-400)" }}>{t("completionLabel")}</span>
                  <span style={{ fontWeight: 500 }}>{p.completionPercent}%</span>
                </div>
                <div style={{ height: "6px", background: "var(--gray-100)", borderRadius: "3px", marginBottom: "12px" }}>
                  <div style={{ height: "100%", width: `${p.completionPercent}%`, background: "var(--primary)", borderRadius: "3px", transition: "width .3s" }} />
                </div>

                {/* Budget */}
                {p.budget > 0 && (
                  <>
                    <div style={{ marginBottom: "4px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--gray-400)" }}>{t("budgetUsedLabel")}</span>
                      <span style={{ fontWeight: 500, color: budgetUsed > 90 ? "var(--danger)" : "inherit" }}>
                        ₹{(p.amountSpent || 0).toLocaleString("en-IN")} / ₹{p.budget.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div style={{ height: "4px", background: "var(--gray-100)", borderRadius: "2px", marginBottom: "14px" }}>
                      <div style={{ height: "100%", width: `${budgetUsed}%`, background: budgetUsed > 90 ? "var(--danger)" : "var(--success)", borderRadius: "2px" }} />
                    </div>
                  </>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowDetail(p)}>👁️ {t("detailBtn")}</button>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>✏️ {t("editBtn")}</button>
                  <button className="btn btn-outline btn-sm" onClick={() => { setShowAssign(p); setAssignForm({ empId: employees[0]?.empId || "", action: "assign" }); }}>👷 {t("assignBtn")}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id, p.name)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={editing ? `${t("editModalTitle")} — ${editing.name}` : t("newProjectModal")}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>{t("cancelBtn")}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? t("savingBtn") : editing ? t("updateBtn") : t("addProjectBtn")}</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t("projectNameField")} *</label><input className="form-control" placeholder={t("placeholderSiteA")} value={form.name} onChange={f("name")} /></div>
            <div className="form-group"><label className="form-label">{t("locationField")} *</label><input className="form-control" placeholder={t("placeholderLocation")} value={form.location} onChange={f("location")} /></div>
            <div className="form-group"><label className="form-label">{t("clientNameField")}</label><input className="form-control" placeholder={t("placeholderClientName")} value={form.clientName} onChange={f("clientName")} /></div>
            <div className="form-group"><label className="form-label">{t("clientPhoneField")}</label><input className="form-control" placeholder={t("placeholderPhone")} value={form.clientPhone} onChange={f("clientPhone")} /></div>
            <div className="form-group"><label className="form-label">{t("budgetField")}</label><input className="form-control" type="number" placeholder={t("placeholderBudget")} value={form.budget} onChange={f("budget")} /></div>
            <div className="form-group"><label className="form-label">{t("projectStatus")}</label>
              <select className="form-control" value={form.status} onChange={f("status")}>
                {["Active","On Hold","Completed","Cancelled"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("startDateField")}</label><input className="form-control" type="date" value={form.startDate} onChange={f("startDate")} /></div>
            <div className="form-group"><label className="form-label">{t("deadlineField")}</label><input className="form-control" type="date" value={form.deadline} onChange={f("deadline")} /></div>
            <div className="form-group"><label className="form-label">{t("supervisorEmpId")}</label>
              <select className="form-control" value={form.supervisorId} onChange={f("supervisorId")}>
                <option value="">{t("placeholderSupervisor")}</option>
                {employees.map(e => <option key={e.empId} value={e.empId}>{e.empId} — {e.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("geoFenceRadius")}</label><input className="form-control" type="number" placeholder={t("placeholderGeoRadius")} value={form.geoFenceRadius} onChange={f("geoFenceRadius")} /></div>
            <div className="form-group"><label className="form-label">{t("siteLatitude")}</label><input className="form-control" placeholder={t("placeholderLat")} value={form.siteLatitude} onChange={f("siteLatitude")} /></div>
            <div className="form-group"><label className="form-label">{t("siteLongitude")}</label><input className="form-control" placeholder={t("placeholderLng")} value={form.siteLongitude} onChange={f("siteLongitude")} /></div>
          </div>
          <div className="form-group"><label className="form-label">{t("googleMapLink")}</label><input className="form-control" placeholder={t("placeholderMapLink")} value={form.googleMapLink} onChange={f("googleMapLink")} /></div>
          <div className="form-group"><label className="form-label">{t("descriptionField")}</label><textarea className="form-control" rows={2} placeholder={t("placeholderProjectDesc")} value={form.description} onChange={f("description")} /></div>
          {editing && (
            <div className="form-group">
              <label className="form-label">{t("completionPercent")}</label>
              <input className="form-control" type="number" min="0" max="100" value={form.completionPercent || 0} onChange={f("completionPercent")} />
            </div>
          )}
        </Modal>
      )}

      {/* Assign Employee Modal */}
      {showAssign && (
        <Modal
          title={`${t("assignEmployeeModal")} — ${showAssign.name}`}
          onClose={() => setShowAssign(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowAssign(false)}>{t("cancelBtn")}</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={saving}>{saving ? t("savingBtn") : t("confirmBtn")}</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">{t("actionLabel")}</label>
            <select className="form-control" value={assignForm.action} onChange={e => setAssignForm({ ...assignForm, action: e.target.value })}>
              <option value="assign">{t("assignToSiteOption")}</option>
              <option value="unassign">{t("removeFromSiteOption")}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t("employeeLabel")}</label>
            <select className="form-control" value={assignForm.empId} onChange={e => setAssignForm({ ...assignForm, empId: e.target.value })}>
              {employees.map(e => <option key={e.empId} value={e.empId}>{e.empId} — {e.name} ({e.designation})</option>)}
            </select>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <Modal title={showDetail.name} onClose={() => setShowDetail(null)}>
          <div style={{ fontSize: "14px" }}>
            {[
              ["Status", <Badge type={STATUS_COLORS[showDetail.status]}>{showDetail.status}</Badge>],
              ["Location", showDetail.location],
              ["Client", showDetail.clientName || "—"],
              ["Phone", showDetail.clientPhone || "—"],
              ["Budget", showDetail.budget ? `₹${showDetail.budget.toLocaleString("en-IN")}` : "—"],
              ["Start Date", showDetail.startDate ? new Date(showDetail.startDate).toLocaleDateString("en-IN") : "—"],
              ["Deadline",   showDetail.deadline   ? new Date(showDetail.deadline).toLocaleDateString("en-IN")   : "—"],
              ["Employees",  `${showDetail.employeeCount} assigned`],
              ["Completion", `${showDetail.completionPercent}%`],
              ["Coordinates", showDetail.siteLatitude ? `${showDetail.siteLatitude}, ${showDetail.siteLongitude}` : "Not set"],
              ["Geo-fence",  `${showDetail.geoFenceRadius}m radius`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--gray-100)" }}>
                <span style={{ color: "var(--gray-400)" }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            {showDetail.description && <p style={{ marginTop: "12px", color: "var(--gray-600)", fontSize: "13px" }}>{showDetail.description}</p>}
            {showDetail.googleMapLink && (
              <a href={showDetail.googleMapLink} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: "14px" }}>
                🗺️ Open in Google Maps
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Projects;
