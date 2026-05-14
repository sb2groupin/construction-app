import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { attendanceAPI } from "../../api/attendance.api";
import { salaryAPI } from "../../api/salary.api";
import Loader from "../../components/common/Loader";
import AttendanceCalendar from "../../components/common/AttendanceCalendar";
import { useAuth } from "../../context/AuthContext";
import { toLocalMonthString } from "../../utils/date.utils";
import toast from "react-hot-toast";
import styles from "./EmployeePortal.module.css";

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
          attendanceAPI.getMyAttendance({ month, year }),
          salaryAPI.getMonthly(user.employeeId, { month, year }),
        ]);
        const att = attRes.data.attendance || [];
        setStats({
          present: att.filter((r) => r.present && !r.isHalfDay).length,
          half: att.filter((r) => r.isHalfDay).length,
          absent: att.filter((r) => !r.present).length,
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
          <h1 className="page-title">👤 {t("myDashboard")}</h1>
          <p className="page-subtitle">{today}</p>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">{t("presentThisMonth")}</div>
          <div className="stat-value">{stats.present}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌗</div>
          <div className="stat-label">{t("halfDays")}</div>
          <div className="stat-value">{stats.half}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-label">{t("absent")}</div>
          <div className="stat-value">{stats.absent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-label">{t("salaryThisMonth")}</div>
          <div className="stat-value">₹{(stats.salary / 1000).toFixed(0)}K</div>
        </div>
      </div>

      <div className={styles.quickGrid}>
        <div className="card">
          <div className="card-header">
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIcon}>📅</div>
              <div>
                <div className="card-title">{t("myAttendanceCard")}</div>
                <div className={styles.cardSubtitle}>{t("attendanceCardInfo")}</div>
              </div>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.miniStatGrid}>
              <div className={`${styles.miniStatCard} ${styles.presentCard}`}>
                <div className={styles.miniStatLabel}>{t("presentLabel")}</div>
                <div className={`${styles.miniStatValue} ${styles.presentValue}`}>{stats.present}</div>
              </div>
              <div className={`${styles.miniStatCard} ${styles.halfCard}`}>
                <div className={styles.miniStatLabel}>{t("halfDayLabel")}</div>
                <div className={`${styles.miniStatValue} ${styles.halfValue}`}>{stats.half}</div>
              </div>
              <div className={`${styles.miniStatCard} ${styles.absentCard}`}>
                <div className={styles.miniStatLabel}>{t("absentLabel")}</div>
                <div className={`${styles.miniStatValue} ${styles.absentValue}`}>{stats.absent}</div>
              </div>
            </div>
            <Link to="/my-attendance" className={`btn btn-primary-outline btn-sm ${styles.fullWidthLink}`}>
              {t("details")}
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIcon}>💰</div>
              <div>
                <div className="card-title">{t("mySalaryCard")}</div>
                <div className={styles.cardSubtitle}>{t("salaryCardInfo")}</div>
              </div>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.salarySummary}>
              <div className={styles.miniStatLabel}>{t("totalSalary")}</div>
              <div className={styles.salarySummaryValue}>₹{stats.salary.toLocaleString("en-IN")}</div>
            </div>
            <Link to="/my-salary" className={`btn btn-primary-outline btn-sm ${styles.fullWidthLink}`}>
              {t("salaryDetails")}
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIcon}>🏖️</div>
              <div>
                <div className="card-title">{t("myLeavesCard")}</div>
                <div className={styles.cardSubtitle}>{t("leavesCardInfo")}</div>
              </div>
            </div>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.subtleText}>{t("checkYourBalance")}</p>
            <Link to="/my-leaves" className={`btn btn-primary-outline btn-sm ${styles.fullWidthLink}`}>
              {t("request")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MyAttendance = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState("calendar");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const thisMonth = toLocalMonthString();
  const [month, setMonth] = useState(thisMonth);

  useEffect(() => {
    setLoading(true);
    const [y, m] = month.split("-");
    attendanceAPI
      .getMyAttendance({ month: m, year: y })
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
          <h1 className="page-title">📅 {t("attendanceTitle")}</h1>
          <p className="page-subtitle">{t("attendanceSubtitle")}</p>
        </div>
        <div className={styles.tabGroup}>
          <button
            onClick={() => setTab("calendar")}
            className={`btn btn-sm ${tab === "calendar" ? "btn-primary" : "btn-outline"}`}
          >
            📅 {t("calendar")}
          </button>
          <button
            onClick={() => setTab("list")}
            className={`btn btn-sm ${tab === "list" ? "btn-primary" : "btn-outline"}`}
          >
            📋 {t("list")}
          </button>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">{t("present")}</div>
          <div className="stat-value">{present}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌗</div>
          <div className="stat-label">{t("halfDay")}</div>
          <div className="stat-value">{half}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-label">{t("absentStatus")}</div>
          <div className="stat-value">{absent}</div>
        </div>
      </div>

      {tab === "calendar" ? (
        <div className="card">
          <div className="card-header">
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIcon}>📅</div>
              <div>
                <div className="card-title">{t("attendanceCalendar")}</div>
                <div className={styles.cardSubtitle}>{t("monthlyInfo")}</div>
              </div>
            </div>
            <input
              type="month"
              className={`form-control ${styles.monthInput}`}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className={styles.cardBody}>
            <AttendanceCalendar employeeId={user.employeeId} />
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIcon}>📋</div>
              <div>
                <div className="card-title">{t("attendanceRecord")}</div>
                <div className={styles.cardSubtitle}>{t("detailedInfo")}</div>
              </div>
            </div>
            <input
              type="month"
              className={`form-control ${styles.monthInput}`}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className={styles.cardBody}>
            {loading ? (
              <Loader fullPage={false} />
            ) : records.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-title">{t("noRecords")}</div>
                <div className={styles.emptyStateText}>{t("noRecordsMsg")}</div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>{t("date")}</th>
                      <th>{t("status")}</th>
                      <th>{t("checkIn")}</th>
                      <th>{t("checkOut")}</th>
                      <th>{t("hours")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id}>
                        <td className={styles.cellStrong}>
                          {new Date(r.date).toLocaleDateString("en-IN")}
                        </td>
                        <td>
                          {r.present ? (
                            r.isHalfDay ? (
                              <span className="badge badge-warning">
                                <span className="dot dot-warning"></span>{t("halfDay")}
                              </span>
                            ) : (
                              <span className="badge badge-success">
                                <span className="dot dot-success"></span>{t("present")}
                              </span>
                            )
                          ) : (
                            <span className="badge badge-danger">
                              <span className="dot dot-danger"></span>{t("absentStatus")}
                            </span>
                          )}
                        </td>
                        <td className={styles.cellSmall}>
                          {r.checkInTime
                            ? new Date(r.checkInTime).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className={styles.cellSmall}>
                          {r.checkOutTime
                            ? new Date(r.checkOutTime).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className={`${styles.cellSmall} ${styles.cellStrong}`}>
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

export const MySalary = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const thisMonth = toLocalMonthString();
  const [month, setMonth] = useState(thisMonth);

  const check = async () => {
    const [year, m] = month.split("-");
    setLoading(true);
    try {
      const res = await salaryAPI.getMonthly(user.employeeId, { month: m, year });
      setResult(res.data);
    } catch {
      toast.error(t("salaryLoadError") || "Failed to load salary");
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
          <h1 className="page-title">💰 {t("mySalary")}</h1>
          <p className="page-subtitle">{t("salaryDetails")}</p>
        </div>
        <input
          type="month"
          className={`form-control ${styles.monthInput}`}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {result && (
        <div className={styles.salaryContainer}>
          <div className="card">
            <div className="card-header">
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardIcon}>📋</div>
                <div>
                  <div className="card-title">{t("salarySlip")}</div>
                  <div className={styles.cardSubtitle}>
                    {result.month}/{result.year}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.detailsList}>
                {[
                  [t("employeeId"), result.empId],
                  [t("salaryType"), result.salaryType === "monthly" ? t("monthlyFixed") : t("dailyWage")],
                  result.salaryType === "monthly"
                    ? [t("monthlySalary"), `₹${result.monthlySalary?.toLocaleString("en-IN")}`]
                    : [t("dailyWageAmount"), `₹${result.dailyWage?.toLocaleString("en-IN")}`],
                  [
                    t("totalDaysPresent"),
                    `${result.presentDays} (${result.fullDays} ${t("fullDays")} + ${result.halfDays} ${t("halfDaysCount")})`,
                  ],
                ].map(([k, v]) => (
                  <div key={k} className={styles.detailsRow}>
                    <span className={styles.detailsKey}>{k}</span>
                    <span className={styles.detailsValue}>{v}</span>
                  </div>
                ))}
              </div>

              <div className={styles.earningsBox}>
                <div className={styles.boxHeading}>{t("earningsDeductions")}</div>
                {[
                  [t("basicSalary"), `₹${result.basicSalary?.toLocaleString("en-IN")}`, true],
                  ...(result.overtimeAmount > 0
                    ? [[t("overtime"), `₹${result.overtimeAmount?.toLocaleString("en-IN")}`, true]]
                    : []),
                  ...(result.incentiveAmount > 0
                    ? [[t("incentive"), `₹${result.incentiveAmount?.toLocaleString("en-IN")}`, true]]
                    : []),
                  ...(result.advanceDeduction > 0
                    ? [[t("advanceDeduction"), `-₹${result.advanceDeduction?.toLocaleString("en-IN")}`, false]]
                    : []),
                  ...(result.leaveDeduction > 0
                    ? [[t("leaveDeduction"), `-₹${result.leaveDeduction?.toLocaleString("en-IN")}`, false]]
                    : []),
                ].map(([k, v, isPositive]) => (
                  <div key={k} className={styles.earnRow}>
                    <span>{k}</span>
                    <span className={isPositive ? styles.earnPositive : styles.earnNegative}>{v}</span>
                  </div>
                ))}
              </div>

              <div className={styles.netSalaryBox}>
                <span className={styles.netSalaryLabel}>{t("netSalary")}</span>
                <span className={styles.netSalaryAmount}>₹{result.netSalary?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
