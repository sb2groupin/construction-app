import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { attendanceAPI } from "../../api/attendance.api";
import { expenseAPI } from "../../api/extra.api";
import { projectAPI } from "../../api/project.api";
import { leaveAPI } from "../../api/leave.api";
import { employeeAPI } from "../../api/employee.api";
import Loader from "../../components/common/Loader";
import StatCard from "../../components/common/StatCard";

// Simple bar chart using pure CSS/SVG — no external library needed
const BarChart = ({ data, title, color = "#2563eb", height = 140 }) => {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px", color: "var(--gray-700)" }}>{title}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: `${height}px`, padding: "0 4px" }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "10px", color: "var(--gray-500)", fontWeight: 600 }}>{d.value}</span>
            <div style={{
              width: "100%", background: color, borderRadius: "4px 4px 0 0",
              height: `${Math.max((d.value / max) * (height - 30), d.value > 0 ? 4 : 0)}px`,
              transition: "height .5s ease", opacity: 0.85,
            }} />
            <span style={{ fontSize: "9px", color: "var(--gray-400)", textAlign: "center", lineHeight: 1.2 }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Donut chart using SVG
const DonutChart = ({ data, title }) => {
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ fontSize: "13px", color: "var(--gray-400)" }}>{title}: No data</div>;
  let offset = 0;
  const COLORS = ["#2563eb","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2"];
  const r = 50, cx = 60, cy = 60, stroke = 20;
  const circumference = 2 * Math.PI * r;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const seg = { pct, dashArray: `${pct * circumference} ${circumference}`, offset, color: COLORS[i % COLORS.length], ...d };
    offset += pct * circumference;
    return seg;
  });
  return (
    <div>
      <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px", color: "var(--gray-700)" }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--gray-100)" strokeWidth={stroke} />
          {segments.map((seg, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={-seg.offset + circumference * 0.25}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))}
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="600" fill="var(--gray-700)">{total}</text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: seg.color, flexShrink: 0 }} />
              <span style={{ color: "var(--gray-600)" }}>{seg.label}</span>
              <span style={{ fontWeight: 600, color: "var(--gray-800)" }}>{seg.value}</span>
              <span style={{ color: "var(--gray-400)" }}>({Math.round(seg.pct * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AnalyticsDashboard = () => {
  const { t } = useTranslation();
  const [loading,  setLoading]  = useState(true);
  const [data,     setData]     = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const now   = new Date();
        const month = now.getMonth() + 1;
        const year  = now.getFullYear();

        const [empRes, projRes, attRes, expRes, leaveRes] = await Promise.all([
          employeeAPI.getAll({ isActive: true }),
          projectAPI.getAll(),
          attendanceAPI.todaySummary(),
          expenseAPI.getAll({ status: "Approved" }),
          leaveAPI.getAll({ status: "Pending" }),
        ]);

        const projects   = projRes.data.projects || [];
        const employees  = empRes.data.employees || [];
        const expenses   = expRes.data.expenses  || [];
        const att        = attRes.data || {};

        // Monthly attendance for last 6 months bar chart
        const monthlyAtt = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(year, month - 1 - i, 1);
          const label = d.toLocaleDateString("en-IN", { month: "short" });
          monthlyAtt.push({ label, value: Math.floor(Math.random() * 20) + 15 }); // placeholder
        }

        // Expense by category
        const expByCategory = {};
        expenses.forEach(e => { expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount; });
        const expData = Object.entries(expByCategory).map(([label, value]) => ({ label, value }));

        // Projects by status
        const statusCount = { Active: 0, "On Hold": 0, Completed: 0, Cancelled: 0 };
        projects.forEach(p => { if (statusCount[p.status] !== undefined) statusCount[p.status]++; });
        const projData = Object.entries(statusCount).filter(([, v]) => v > 0).map(([label, value]) => ({ label, value }));

        setData({
          totalEmployees:  employees.length,
          activeProjects:  projects.filter(p => p.status === "Active").length,
          totalProjects:   projects.length,
          presentToday:    att.present || 0,
          absentToday:     att.absent  || 0,
          pendingLeaves:   leaveRes.data.total || 0,
          totalBudget:     projects.reduce((s, p) => s + (p.budget || 0), 0),
          totalSpent:      projects.reduce((s, p) => s + (p.amountSpent || 0), 0),
          expenseTotal:    expenses.reduce((s, e) => s + e.amount, 0),
          monthlyAtt, expData, projData,
        });
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <Loader fullPage={false} />;
  if (!data)   return <div className="page-content"><div className="card"><p>Data load nahi hua</p></div></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">{t("analyticsDashboardTitle")}</h1><p className="page-subtitle">{t("analyticsDashboardSubtitle")}</p></div>
      </div>

      {/* KPI Cards */}
      <div className="stat-cards" style={{ marginBottom: "20px" }}>
        <StatCard icon="👷" label={t("totalEmployeesLabel")}  value={data.totalEmployees}  color="blue"   />
        <StatCard icon="✅" label={t("presentTodayLabel")}     value={data.presentToday}    color="green"  />
        <StatCard icon="🏗️" label={t("activeSitesLabel")}     value={data.activeProjects}  color="blue"   />
        <StatCard icon="🏖️" label={t("pendingLeavesLabel")}   value={data.pendingLeaves}   color="orange" />
      </div>

      {/* Budget Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: t("totalBudget"), value: `₹${data.totalBudget.toLocaleString("en-IN")}`, color: "var(--primary)" },
          { label: t("totalSpent"),  value: `₹${data.totalSpent.toLocaleString("en-IN")}`,  color: "var(--danger)"  },
          { label: t("remainingBudget"),    value: `₹${(data.totalBudget - data.totalSpent).toLocaleString("en-IN")}`, color: "var(--success)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "var(--gray-400)", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        <div className="card">
          <BarChart data={data.monthlyAtt} title={t("monthlyAttendanceTrend")} color="#16a34a" />
        </div>
        <div className="card">
          <DonutChart data={data.expData} title={t("expenseByCategory")} />
        </div>
        <div className="card">
          <DonutChart data={data.projData} title={t("projectsByStatus")} />
        </div>
      </div>

      {/* Attendance today detail */}
      <div className="card" style={{ marginTop: "16px" }}>
        <div className="card-header"><h3 className="card-title">{t("todaysOverview")}</h3></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
          {[
            { label: t("presentLabel"), value: data.presentToday, color: "#16a34a", bg: "#f0fdf4" },
            { label: t("absentLabel"),  value: data.absentToday,  color: "#dc2626", bg: "#fef2f2" },
            { label: t("notMarkedLabel"), value: Math.max(0, data.totalEmployees - data.presentToday - data.absentToday), color: "#d97706", bg: "#fffbeb" },
          ].map(s => (
            <div key={s.label} style={{ padding: "14px", background: s.bg, borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: s.color, marginTop: "4px" }}>{s.label}</div>
              {data.totalEmployees > 0 && <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                {Math.round(s.value / data.totalEmployees * 100)}% of total
              </div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
