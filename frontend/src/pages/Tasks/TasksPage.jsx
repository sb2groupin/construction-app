import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { taskAPI } from "../../api/extra.api";
import { employeeAPI } from "../../api/employee.api";
import { projectAPI } from "../../api/project.api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

const PRI_COLOR = { High: "danger", Medium: "warning", Low: "success" };
const STATUS_COLOR = { Pending: "warning", "In Progress": "primary", Completed: "success" };

const TasksPage = () => {
  const { t } = useTranslation();
  const { isAdmin, user } = useAuth();
  const [tasks,      setTasks]      = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDone,   setShowDone]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const photoRef = useRef();

  const [form, setForm] = useState({ projectId: "", assignedTo: "", title: "", description: "", priority: "Medium", dueDate: "", isRecurring: false, recurringType: "None" });

  useEffect(() => {
    Promise.all([
      isAdmin ? employeeAPI.getAll({ isActive: true }) : Promise.resolve(null),
      projectAPI.getAll(),
    ]).then(([empRes, projRes]) => {
      if (empRes) setEmployees(empRes.data.employees || []);
      setProjects(projRes.data.projects || []);
    }).catch(() => toast.error(t("loadError"))).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTasks(); }, [filterStatus]);

  const loadTasks = async () => {
    const params = filterStatus ? { status: filterStatus } : {};
    try { const res = await taskAPI.getAll(params); setTasks(res.data.tasks || []); }
    catch { toast.error(t("loadError")); }
  };

  const handleCreate = async () => {
    if (!form.assignedTo || !form.title) { toast.error(t("requiredFields")); return; }
    setSaving(true);
    try { await taskAPI.create(form); toast.success(t("taskAdded")); setShowCreate(false); loadTasks(); }
    catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    const fd = new FormData();
    fd.append("status", status);
    if (status === "Completed" && photoRef.current?.files[0]) fd.append("photo", photoRef.current.files[0]);
    try { await taskAPI.update(id, fd); toast.success(t("taskUpdated")); setShowDone(null); loadTasks(); }
    catch { toast.error(t("saveError")); }
  };

  const deleteTask = async (id) => {
    if (!confirm(t("confirmDelete"))) return;
    try { await taskAPI.remove(id); toast.success(t("deleteSuccess")); loadTasks(); }
    catch { toast.error(t("deleteError")); }
  };

  if (loading) return <Loader fullPage={false} />;

  const overdue = tasks.filter(t => t.isOverdue).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("tasks")}</h1>
          <p className="page-subtitle">{overdue > 0 && <span style={{ color: "var(--danger)" }}>⚠️ {overdue} {t("overdue")} · </span>}{tasks.length} {t("totalTasks")}</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ {t("assignTask")}</button>}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
        {["","Pending","In Progress","Completed"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className="btn btn-sm"
            style={{ background: filterStatus === s ? "var(--primary)" : "var(--gray-100)", color: filterStatus === s ? "white" : "var(--gray-600)", border: "none" }}>
            {s === "" ? t("all") : s === "Pending" ? t("pending") : s === "In Progress" ? t("inProgress") : t("completed")}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="card"><div className="empty-state"><span style={{ fontSize: "40px" }}>✅</span><p>{t("noTasksFound")}</p></div></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
          {tasks.map(task => (
            <div key={task._id} className="card" style={{ borderLeft: task.isOverdue ? "3px solid var(--danger)" : task.priority === "High" ? "3px solid var(--danger)" : task.priority === "Medium" ? "3px solid var(--warning)" : "3px solid var(--success)", borderRadius: "0 12px 12px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{task.title}</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <Badge type={PRI_COLOR[task.priority]}>{task.priority}</Badge>
                    <Badge type={STATUS_COLOR[task.status]}>{task.status}</Badge>
                    {task.isOverdue && <Badge type="danger">⚠️ Overdue</Badge>}
                  </div>
                </div>
                {isAdmin && <button className="btn btn-outline btn-sm" onClick={() => deleteTask(task._id)}>🗑️</button>}
              </div>

              {task.description && <p style={{ fontSize: "13px", color: "var(--gray-600)", marginBottom: "8px", lineHeight: 1.5 }}>{task.description}</p>}

              <div style={{ fontSize: "12px", color: "var(--gray-400)", display: "flex", flexDirection: "column", gap: "3px" }}>
                <span>👷 {task.assignedTo}</span>
                {task.dueDate && <span style={{ color: task.isOverdue ? "var(--danger)" : "inherit" }}>📅 Due: {task.dueDate}</span>}
                {task.completedAt && <span>✅ Completed: {new Date(task.completedAt).toLocaleDateString("en-IN")}</span>}
              </div>

              {task.completionPhoto && (
                <img src={`http://localhost:5000${task.completionPhoto}`} alt="completion" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", marginTop: "8px" }} />
              )}

              {/* Actions */}
              {task.status !== "Completed" && (
                <div style={{ marginTop: "10px", display: "flex", gap: "6px" }}>
                  {task.status === "Pending" && (
                    <button className="btn btn-outline btn-sm" onClick={() => updateStatus(task._id, "In Progress")}>▶ Start</button>
                  )}
                  <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => setShowDone(task)}>✅ Mark Complete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <Modal title={t("createTask")} onClose={() => setShowCreate(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowCreate(false)}>{t("cancel")}</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? t("loading") : t("assignTask")}</button></>}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">{t("site")}</label>
              <select className="form-control" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
                <option value="">{t("noSite")}</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("assignTo")} *</label>
              <select className="form-control" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">{t("selectEmployee")}</option>
                {employees.map(e => <option key={e.empId} value={e.empId}>{e.empId} — {e.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("taskPriority")}</label>
              <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {[t("high"),t("medium"),t("low")].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t("date")}</label><input type="date" className="form-control" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">{t("taskTitle")} *</label><input className="form-control" placeholder={t("whatToDo")} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">{t("description")}</label><textarea className="form-control" rows={2} placeholder={t("details")} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={e => setForm({ ...form, isRecurring: e.target.checked })} />
            <label htmlFor="recurring" className="form-label" style={{ margin: 0 }}>{t("recurringTask")}</label>
            {form.isRecurring && (
              <select className="form-control" style={{ width: "auto" }} value={form.recurringType} onChange={e => setForm({ ...form, recurringType: e.target.value })}>
                {[t("daily"),t("weekly")].map(r => <option key={r}>{r}</option>)}
              </select>
            )}
          </div>
        </Modal>
      )}

      {/* Complete Modal */}
      {showDone && (
        <Modal title={t("markCompleted")} onClose={() => setShowDone(null)}
          footer={<><button className="btn btn-outline" onClick={() => setShowDone(null)}>{t("cancel")}</button><button className="btn btn-success" onClick={() => updateStatus(showDone._id, "Completed")}>✅ {t("complete")}</button></>}>
          <p style={{ fontSize: "13px", color: "var(--gray-400)", marginBottom: "14px" }}><strong>{showDone.title}</strong></p>
          <div className="form-group"><label className="form-label">{t("completionPhoto")}</label><input ref={photoRef} type="file" accept="image/*" className="form-control" /></div>
        </Modal>
      )}
    </div>
  );
};

export default TasksPage;
