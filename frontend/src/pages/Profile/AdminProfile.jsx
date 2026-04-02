import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../api/auth.api";
import { settingsAPI } from "../../api/settings.api";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

const AdminProfile = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  const [profile, setProfile] = useState({ name: user?.name || "", phone: "", email: "" });
  const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [passStrength, setPassStrength] = useState({ score: 0, label: "", color: "" });

  useEffect(() => {
    settingsAPI.get().then(() => {}).catch(() => {}).finally(() => setLoading(false));
    if (tab === "sessions") loadSessions();
  }, [tab]);

  const loadSessions = async () => {
    try { const r = await authAPI.getSessions(); setSessions(r.data.sessions || []); }
    catch (_) {}
  };

  const checkStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8)          score++;
    if (/[0-9]/.test(pwd))        score++;
    if (/[!@#$%^&*]/.test(pwd))   score++;
    if (/[A-Z]/.test(pwd))        score++;
    const labels = ["","Weak","Fair","Good","Strong"];
    const colors = ["","#E24B4A","#BA7517","#1D9E75","#185FA5"];
    setPassStrength({ score, label: labels[score] || "Weak", color: colors[score] || "#E24B4A" });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      updateProfile({ name: profile.name, phone: profile.phone });
      toast.success(t("updateSuccess"));
    } catch { toast.error(t("updateFailed")); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (passForm.newPassword !== passForm.confirm) { toast.error(t("passwordMismatch")); return; }
    if (passStrength.score < 2) { toast.error(t("passwordStrong")); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ oldPassword: passForm.oldPassword, newPassword: passForm.newPassword });
      toast.success(t("passwordChanged"));
      setPassForm({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (err) { toast.error(err.message || t("saveError")); }
    finally { setSaving(false); }
  };

  const handleForceLogout = async (userId, username) => {
    if (!confirm(t("confirmRemove", { name: username }))) return;
    try {
      await authAPI.forceLogout(userId);
      toast.success(t("logoutSuccess"));
      loadSessions();
    } catch { toast.error(t("saveError")); }
  };

  const initials = (name) => name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : user?.username?.[0]?.toUpperCase() || "A";

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Account settings aur security</p></div>
      </div>

      {/* Avatar card */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "24px", fontWeight: 700, flexShrink: 0 }}>
          {initials(profile.name || user?.username || "")}
        </div>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{profile.name || user?.username}</div>
          <div style={{ fontSize: "13px", color: "var(--gray-400)", marginTop: "4px" }}>
            <span style={{ background: "#E6F1FB", color: "#0C447C", padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 500 }}>🔑 Admin</span>
            <span style={{ marginLeft: "10px" }}>@{user?.username}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", borderBottom: "1px solid var(--gray-200)", paddingBottom: "10px" }}>
        {[["profile","👤 Profile"],["password","🔒 Password"],["sessions","💻 Sessions"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="btn btn-sm"
            style={{ background: tab === id ? "var(--primary)" : "transparent", color: tab === id ? "white" : "var(--gray-600)", border: tab === id ? "none" : "1px solid var(--gray-200)" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="card" style={{ maxWidth: "520px" }}>
          <div className="card-header"><h3 className="card-title">Profile Details</h3></div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" placeholder="Apna naam" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" placeholder="9876543210" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Email</label>
              <input className="form-control" type="email" placeholder="admin@company.com" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px", padding: "10px 12px", background: "var(--gray-50)", borderRadius: "8px", fontSize: "13px" }}>
            <span style={{ color: "var(--gray-400)" }}>Username:</span>
            <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{user?.username}</span>
            <span style={{ fontSize: "11px", color: "var(--gray-400)" }}>(change nahi ho sakta)</span>
          </div>
          <button className="btn btn-primary" style={{ marginTop: "16px" }} onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* Password Tab */}
      {tab === "password" && (
        <div className="card" style={{ maxWidth: "440px" }}>
          <div className="card-header"><h3 className="card-title">Change Password</h3></div>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-control" type="password" value={passForm.oldPassword} onChange={e => setPassForm({ ...passForm, oldPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-control" type="password" placeholder="Min 8 chars, 1 number, 1 special char"
              value={passForm.newPassword}
              onChange={e => { setPassForm({ ...passForm, newPassword: e.target.value }); checkStrength(e.target.value); }} />
            {passForm.newPassword && (
              <div style={{ marginTop: "6px" }}>
                <div style={{ height: "4px", background: "var(--gray-100)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${passStrength.score * 25}%`, background: passStrength.color, transition: "width .3s, background .3s" }} />
                </div>
                <span style={{ fontSize: "11px", color: passStrength.color, marginTop: "4px", display: "block" }}>{passStrength.label}</span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-control" type="password" value={passForm.confirm} onChange={e => setPassForm({ ...passForm, confirm: e.target.value })} />
            {passForm.confirm && passForm.newPassword !== passForm.confirm && (
              <span style={{ fontSize: "11px", color: "var(--danger)", marginTop: "4px", display: "block" }}>Passwords match nahi karte</span>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "var(--gray-400)", padding: "8px 10px", background: "var(--gray-50)", borderRadius: "6px", marginBottom: "14px" }}>
            Password rules: Min 8 characters · 1 number · 1 special character (!@#$%^&*)
          </div>
          <button className="btn btn-primary w-full" onClick={changePassword} disabled={saving || passForm.newPassword !== passForm.confirm}>
            {saving ? "Changing..." : "Change Password"}
          </button>
        </div>
      )}

      {/* Sessions Tab */}
      {tab === "sessions" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Active Sessions</h3>
            <button className="btn btn-outline btn-sm" onClick={loadSessions}>↻ Refresh</button>
          </div>
          {sessions.length === 0 ? (
            <div className="empty-state"><span style={{ fontSize: "36px" }}>💻</span><p>Koi active session nahi</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Username</th><th>Role</th><th>Last Active</th><th>Action</th></tr></thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 500 }}>@{s.username} {s.username === user?.username && <span style={{ fontSize: "10px", background: "#E1F5EE", color: "#085041", padding: "1px 6px", borderRadius: "8px", marginLeft: "6px" }}>You</span>}</td>
                      <td><span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "8px", background: s.role === "admin" ? "#E6F1FB" : "#F0FDF4", color: s.role === "admin" ? "#0C447C" : "#085041" }}>{s.role}</span></td>
                      <td style={{ fontSize: "12px", color: "var(--gray-400)" }}>{new Date(s.updatedAt).toLocaleString("en-IN")}</td>
                      <td>
                        {s.username !== user?.username && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleForceLogout(s._id, s.username)}>Force Logout</button>
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
    </div>
  );
};

export default AdminProfile;
