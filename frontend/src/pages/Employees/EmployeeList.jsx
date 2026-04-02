import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { employeeAPI } from "../../api/employee.api";
import { authAPI } from "../../api/auth.api";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

const EMPTY_FORM = { name: "", phone: "", dailyWage: "", designation: "Worker", address: "", emergencyContact: "" };
const DESIGNATIONS = ["Worker", "Mason", "Helper", "Supervisor", "Electrician", "Plumber", "Carpenter"];

const EmployeeList = () => {
  const { t } = useTranslation();
  const [employees, setEmployees]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [loginForm, setLoginForm]     = useState({ username: "", password: "", employeeId: "" });
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState("");

  const load = async () => {
    try {
      const res = await employeeAPI.getAll({ isActive: true });
      setEmployees(res.data.employees || []);
    } catch { toast.error(t("loadError")); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (emp) => { setEditing(emp); setForm({ name: emp.name, phone: emp.phone, dailyWage: emp.dailyWage, designation: emp.designation, address: emp.address || "", emergencyContact: emp.emergencyContact || "" }); setShowModal(true); };
  const openLoginModal = (emp) => { setLoginForm({ username: emp.empId.toLowerCase(), password: "", employeeId: emp.empId }); setShowLoginModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.dailyWage) { toast.error(t("requiredFields")); return; }
    setSaving(true);
    try {
      if (editing) {
        await employeeAPI.update(editing.empId, form);
        toast.success(t("updateSuccess"));
      } else {
        await employeeAPI.add(form);
        toast.success(t("addSuccess"));
      }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const handleDelete = async (empId) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await employeeAPI.remove(empId);
      toast.success(t("deleteSuccess"));
      load();
    } catch { toast.error(t("deleteError")); }
  };

  const handleCreateLogin = async () => {
    if (!loginForm.password) { toast.error(t("password")); return; }
    setSaving(true);
    try {
      await authAPI.createEmployeeLogin(loginForm);
      toast.success(`${t("loginSuccess")} - ${loginForm.username}`);
      setShowLoginModal(false);
    } catch (err) { toast.error(err.message || t("loginFailed")); }
    finally { setSaving(false); }
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.empId.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("employees")}</h1>
          <p className="page-subtitle">{employees.length} {t("totalEmployees")}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ {t("addEmployee")}</button>
      </div>

      <div className="card">
        <div className="card-header">
          <input className="form-control" style={{ maxWidth: "280px" }} placeholder={`🔍 ${t("name")}`} value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ fontSize: "13px", color: "var(--gray-400)" }}>{filtered.length} {t("noRecordsFound")}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><span style={{ fontSize: "40px" }}>👷</span><p>{t("noEmployeesFound")}</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>{t("name")}</th><th>{t("role")}</th><th>{t("phone")}</th><th>{t("dailyWage")}</th><th>{t("delete")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp._id}>
                    <td><Badge type="primary">{emp.empId}</Badge></td>
                    <td style={{ fontWeight: 500 }}>{emp.name}</td>
                    <td>{emp.designation}</td>
                    <td>{emp.phone || "—"}</td>
                    <td>₹{emp.dailyWage}/day</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(emp)}>✏️ {t("edit")}</button>
                        <button className="btn btn-outline btn-sm" onClick={() => openLoginModal(emp)} title={t("login")}>🔑</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.empId)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={editing ? `${t("edit")} — ${editing.empId}` : t("addEmployee")}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>{t("cancel")}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? t("loading") : editing ? t("update") : t("add")}</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t("name")} *</label>
              <input className="form-control" placeholder={t("employeeName")} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t("dailyWage")} (₹) *</label>
              <input className="form-control" type="number" placeholder="500" value={form.dailyWage} onChange={e => setForm({ ...form, dailyWage: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t("phone")}</label>
              <input className="form-control" placeholder="9876543210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t("role")}</label>
              <select className="form-control" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}>
                {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t("emergencyContact")}</label>
              <input className="form-control" placeholder={t("contactNumber")} value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t("address")}</label>
              <input className="form-control" placeholder={t("cityState")} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}

      {/* Create Login Modal */}
      {showLoginModal && (
        <Modal
          title={t("createEmployeeLoginTitle")}
          onClose={() => setShowLoginModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowLoginModal(false)}>{t("cancel")}</button>
              <button className="btn btn-success" onClick={handleCreateLogin} disabled={saving}>{saving ? t("loading") : t("createLogin")}</button>
            </>
          }
        >
          <p style={{ fontSize: "13px", color: "var(--gray-400)", marginBottom: "16px" }}>
            {t("employeeId")}: <strong>{loginForm.employeeId}</strong>
          </p>
          <div className="form-group">
            <label className="form-label">{t("username")}</label>
            <input className="form-control" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t("password")} *</label>
            <input className="form-control" type="password" placeholder={t("minimumCharacters")} value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeList;
