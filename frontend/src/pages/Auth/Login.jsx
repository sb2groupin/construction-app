import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import styles from "./Login.module.css";

const Login = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoBlock}>
          <div className={styles.logoIcon}>🏗️</div>
          <h1 className={styles.title}>{t("buildCo")}</h1>
          <p className={styles.subtitle}>{t("siteManagementSystem")}</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>{t("username")}</label>
            <input
              type="text"
              placeholder={t("username")}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t("password")}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${styles.submitButton} ${loading ? styles.submitButtonDisabled : ""}`}
          >
            {loading ? t("loading") : t("login")}
          </button>
        </form>

        <p className={styles.footerNote}>
          Mountain Infra Building (OPC) Pvt. Ltd.
        </p>
      </div>
    </div>
  );
};

export default Login;
