import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Loader from "../../components/common/Loader";
import { employeeAPI } from "../../api/employee.api";
import { attendanceAPI } from "../../api/attendance.api";
import { projectAPI } from "../../api/project.api";
import { leaveAPI } from "../../api/leave.api";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ 
    total: 0, present: 0, absent: 0, notMarked: 0, 
    activeProjects: 0, pendingLeaves: 0 
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [empRes, attRes, projRes, leaveRes] = await Promise.all([
        employeeAPI.getAll({ isActive: true }),
        attendanceAPI.todaySummary(),
        projectAPI.getSummary(),
        leaveAPI.getPendingCount(),
      ]);
      setStats({
        total:          empRes.data.total || 0,
        present:        attRes.data.present || 0,
        absent:         attRes.data.absent || 0,
        notMarked:      attRes.data.notMarked || 0,
        activeProjects: projRes.data.active || 0,
        pendingLeaves:  leaveRes.data.pendingLeaves || 0,
      });
    } catch (err) {
      console.error(err);
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loader fullPage={false} />;

  const today = new Date().toLocaleDateString("en-IN", { 
    weekday: "long", year: "numeric", month: "long", day: "numeric" 
  });

  const quickActions = [
    { icon: "🏗️", label: t("projects"),  href: "/projects",    color: "primary" },
    { icon: "👷", label: t("employees"), href: "/employees",    color: "blue" },
    { icon: "📅", label: t("attendance"), href: "/attendance",   color: "green" },
    { icon: "🏖️", label: t("myLeaves"),   href: "/leaves",       color: "warning", badge: stats.pendingLeaves },
    { icon: "💰", label: t("salary"),     href: "/salary",       color: "info" },
    { icon: "📄", label: t("reports"),    href: "/reports",      color: "orange" },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 {t("adminDashboardTitle")}</h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={loadStats}>
          ↻ {t("loading")}
        </button>
      </div>

      {/* Key Metrics in Grid */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon">👷</div>
          <div className="stat-label">{t("totalEmployees")}</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">{t("presentLabel")}</div>
          <div className="stat-value">{stats.present}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-label">{t("absent")}</div>
          <div className="stat-value">{stats.absent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">{t("notStarted")}</div>
          <div className="stat-value">{stats.notMarked}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏗️</div>
          <div className="stat-label">{t("activeProjects")}</div>
          <div className="stat-value">{stats.activeProjects}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏖️</div>
          <div className="stat-label">{t("pendingLeaves")}</div>
          <div className="stat-value">{stats.pendingLeaves}</div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "var(--text-primary)" }}>
          ⚡ {t("adminDashboardSubtitle")}
        </h2>
        <div className="action-card-grid">
          {quickActions.map((action) => (
            <Link 
              key={action.href} 
              to={action.href} 
              className="action-card"
            >
              {action.badge > 0 && (
                <div className="action-card-badge">{action.badge}</div>
              )}
              <div className="action-card-icon">{action.icon}</div>
              <div className="action-card-label">{action.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
