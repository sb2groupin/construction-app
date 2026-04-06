import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { attendanceAPI } from "../../api/attendance.api";
import { salaryAPI } from "../../api/salary.api";
import StatCard from "../../components/common/StatCard";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import AttendanceCalendar from "../../components/common/AttendanceCalendar";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// ── My Dashboard ──────────────────────────────────────
export const MyDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({ present: 0, half: 0, absent: 0, salary: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const [attRes, salRes] = await Promise.all([
          attendanceAPI.getAll({ month, year }),
          salaryAPI.getMonthly(user.employeeId, { month, year }),
        ]);
        const att = attRes.data.attendance || [];
        setStats({
          present: att.filter(r => r.present && !r.isHalfDay).length,
          half: att.filter(r => r.isHalfDay).length,
          absent: att.filter(r => !r.present).length,
          salary: salRes.data.netSalary || 0,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    if (user.employeeId) load();
    else setLoading(false);
  }, [user.employeeId]);

  if (loading) return <Loader fullPage={false} />;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 {t('myDashboard')}</h1>
          <p className="page-subtitle">{today}</p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">{t('presentThisMonth')}</div>
          <div className="stat-value">{stats.present}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌗</div>
          <div className="stat-label">{t('halfDays')}</div>
          <div className="stat-value">{stats.half}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-label">{t('absent')}</div>
          <div className="stat-value">{stats.absent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-label">{t('salaryThisMonth')}</div>
          <div className="stat-value">₹{(stats.salary / 1000).toFixed(0)}K</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className="mt-24"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon">📅</div>
              <div>
                <div className="card-title">{t('myAttendanceCard')}</div>
                <div className="card-subtitle">{t('attendanceCardInfo')}</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#f0fdf4",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {t('presentLabel')}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "var(--success)",
                  }}
                >
                  {stats.present}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#fef3c7",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {t('halfDayLabel')}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "var(--warning)",
                  }}
                >
                  {stats.half}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#fef2f2",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {t('absentLabel')}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "var(--danger)",
                  }}
                >
                  {stats.absent}
                </div>
              </div>
            </div>
            <Link to="/my-attendance" className="btn btn-primary-outline btn-sm" style={{ width: "100%" }}>
              {t('details')}
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon">💰</div>
              <div>
                <div className="card-title">{t('mySalaryCard')}</div>
                <div className="card-subtitle">{t('salaryCardInfo')}</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div
              style={{
                padding: "12px",
                background:
                  "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(249,115,22,0.05) 100%)",
                borderRadius: "6px",
                marginBottom: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                {t('totalSalary')}
              </div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--primary)" }}>
                ₹{stats.salary.toLocaleString("en-IN")}
              </div>
            </div>
            <Link to="/my-salary" className="btn btn-primary-outline btn-sm" style={{ width: "100%" }}>
              {t('salaryDetails')}
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon">🏖️</div>
              <div>
                <div className="card-title">{t('myLeavesCard')}</div>
                <div className="card-subtitle">{t('leavesCardInfo')}</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
              {t('checkYourBalance')}
            </p>
            <Link to="/my-leaves" className="btn btn-primary-outline btn-sm" style={{ width: "100%" }}>
              {t('request')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── My Attendance ─────────────────────────────────────
export const MyAttendance = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState("calendar");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(thisMonth);

  useEffect(() => {
    setLoading(true);
    const [y, m] = month.split("-");
    attendanceAPI
      .getAll({ month: m, year: y })
      .then((res) => setRecords(res.data.attendance || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month]);

  const present = records.filter((r) => r.present && !r.isHalfDay).length;
  const half = records.filter((r) => r.isHalfDay).length;
  const absent = records.filter((r) => !r.present).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 {t('attendanceTitle')}</h1>
          <p className="page-subtitle">{t('attendanceSubtitle')}</p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setTab("calendar")}
            className={`btn btn-sm ${tab === "calendar" ? "btn-primary" : "btn-outline"}`}
          >
            📅 {t('calendar')}
          </button>
          <button
            onClick={() => setTab("list")}
            className={`btn btn-sm ${tab === "list" ? "btn-primary" : "btn-outline"}`}
          >
            📋 {t('list')}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">{t('present')}</div>
          <div className="stat-value">{present}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌗</div>
          <div className="stat-label">{t('halfDay')}</div>
          <div className="stat-value">{half}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-label">{t('absentStatus')}</div>
          <div className="stat-value">{absent}</div>
        </div>
      </div>

      {/* Calendar or List View */}
      {tab === "calendar" ? (
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon">📅</div>
              <div>
                <div className="card-title">{t('attendanceCalendar')}</div>
                <div className="card-subtitle">{t('monthlyInfo')}</div>
              </div>
            </div>
            <input
              type="month"
              className="form-control"
              style={{ width: "auto" }}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="card-body">
            <AttendanceCalendar employeeId={user.employeeId} />
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon">📋</div>
              <div>
                <div className="card-title">{t('attendanceRecord')}</div>
                <div className="card-subtitle">{t('detailedInfo')}</div>
              </div>
            </div>
            <input
              type="month"
              className="form-control"
              style={{ width: "auto" }}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="card-body">
            {loading ? (
              <Loader fullPage={false} />
            ) : records.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-title">{t('noRecords')}</div>
                <div className="empty-state-text">{t('noRecordsMsg')}</div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>{t('date')}</th>
                      <th>{t('status')}</th>
                      <th>{t('checkIn')}</th>
                      <th>{t('checkOut')}</th>
                      <th>{t('hours')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id}>
                        <td style={{ fontWeight: "500" }}>
                          {new Date(r.date).toLocaleDateString("en-IN")}
                        </td>
                        <td>
                          {r.present ? (
                            r.isHalfDay ? (
                              <span className="badge badge-warning">
                                <span className="dot dot-warning"></span>{t('halfDay')}
                              </span>
                            ) : (
                              <span className="badge badge-success">
                                <span className="dot dot-success"></span>{t('present')}
                              </span>
                            )
                          ) : (
                            <span className="badge badge-danger">
                              <span className="dot dot-danger"></span>{t('absentStatus')}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: "12px" }}>
                          {r.checkInTime
                            ? new Date(r.checkInTime).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td style={{ fontSize: "12px" }}>
                          {r.checkOutTime
                            ? new Date(r.checkOutTime).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td style={{ fontSize: "12px", fontWeight: "500" }}>
                          {r.workingHours ? `${r.workingHours}h` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── My Salary ─────────────────────────────────────────
export const MySalary = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(thisMonth);

  const check = async () => {
    const [year, m] = month.split("-");
    setLoading(true);
    try {
      const res = await salaryAPI.getMonthly(user.employeeId, { month: m, year });
      setResult(res.data);
    } catch {
      toast.error(t('salaryLoadError') || "Failed to load salary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.employeeId) check();
  }, [month, user.employeeId]);

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 {t('mySalary')}</h1>
          <p className="page-subtitle">{t('salaryDetails')}</p>
        </div>
        <input
          type="month"
          className="form-control"
          style={{ width: "auto" }}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {result && (
        <div style={{ maxWidth: "600px" }}>
          {/* Salary Summary Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-icon">📋</div>
                <div>
                  <div className="card-title">{t('salarySlip')}</div>
                  <div className="card-subtitle">
                    {result.month}/{result.year}
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body">
              {/* Salary Details */}
              <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
                {[
                  [t('employeeId'), result.empId],
                  [t('salaryType'), result.salaryType === "monthly" ? t('monthlyFixed') : t('dailyWage')],
                  result.salaryType === "monthly"
                    ? [t('monthlySalary'), `₹${result.monthlySalary?.toLocaleString("en-IN")}`]
                    : [t('dailyWageAmount'), `₹${result.dailyWage?.toLocaleString("en-IN")}`],
                  [
                    t('totalDaysPresent'),
                    `${result.presentDays} (${result.fullDays} ${t('fullDays')} + ${result.halfDays} ${t('halfDaysCount')})`,
                  ],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>
                      {k}
                    </span>
                    <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              {/* Earnings & Deductions */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#fafafa",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  {t('earningsDeductions')}
                </div>
                {[
                  [t('basicSalary'), `₹${result.basicSalary?.toLocaleString("en-IN")}`, true],
                  ...(result.overtimeAmount > 0
                    ? [[t('overtime'), `₹${result.overtimeAmount?.toLocaleString("en-IN")}`, true]]
                    : []),
                  ...(result.incentiveAmount > 0
                    ? [[t('incentive'), `₹${result.incentiveAmount?.toLocaleString("en-IN")}`, true]]
                    : []),
                  ...(result.advanceDeduction > 0
                    ? [
                        [
                          t('advanceDeduction'),
                          `-₹${result.advanceDeduction?.toLocaleString("en-IN")}`,
                          false,
                        ],
                      ]
                    : []),
                  ...(result.leaveDeduction > 0
                    ? [
                        [
                          t('leaveDeduction'),
                          `-₹${result.leaveDeduction?.toLocaleString("en-IN")}`,
                          false,
                        ],
                      ]
                    : []),
                ].map(([k, v, isPositive]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      fontSize: "12px",
                    }}
                  >
                    <span>{k}</span>
                    <span
                      style={{
                        fontWeight: "600",
                        color: isPositive ? "var(--success)" : "var(--danger)",
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              {/* Net Salary */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  background:
                    "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(249,115,22,0.05) 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                  {t('netSalary')}
                </span>
                <span style={{ fontSize: "24px", fontWeight: "700", color: "var(--primary)" }}>
                  ₹{result.netSalary?.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};