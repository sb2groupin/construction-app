import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const Login = () => {
  const { t } = useTranslation();
  const [form, setForm]       = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error(t("requiredFields"));
      return;
    }
    setLoading(true);
    try {
      const role = await login(form.username, form.password);
      toast.success(t("loginSuccess"));
      navigate(role === "admin" ? "/" : "/my-dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || t("loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e293b 0%, #1d4ed8 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "16px",
        padding: "40px 36px",
        width: "100%", maxWidth: "380px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏗️</div>
          <h1 style={{ color: "white", fontSize: "22px", fontWeight: 700, margin: 0 }}>
            {t("buildCo")}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "6px" }}>
            {t("siteManagementSystem")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px" }}>
              {t("username")}
            </label>
            <input
              type="text"
              placeholder={t("username")}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              style={{
                width: "100%", padding: "11px 14px",
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px", color: "white", fontSize: "14px", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px" }}>
              {t("password")}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{
                width: "100%", padding: "11px 14px",
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px", color: "white", fontSize: "14px", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px",
              background: loading ? "#64748b" : "#22c55e",
              border: "none", borderRadius: "8px",
              color: "white", fontWeight: 600, fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? t("loading") : t("login")}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "24px" }}>
          Mountain Infra Building (OPC) Pvt. Ltd.
        </p>
      </div>
    </div>
  );
};

export default Login;
