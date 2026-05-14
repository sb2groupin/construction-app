import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { attendanceAPI } from "../../api/attendance.api";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import { getAssetUrl } from "../../utils/url.utils";
import { toLocalMonthString } from "../../utils/date.utils";
import toast from "react-hot-toast";

const FlaggedAttendance = () => {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const thisMonth = toLocalMonthString();
  const [month, setMonth] = useState(thisMonth);

  useEffect(() => {
    const [year, m] = month.split("-");
    setLoading(true);
    attendanceAPI.getFlagged({ month: m, year })
      .then(res => setRecords(res.data?.flagged || []))
      .catch(() => toast.error(t("loadError")))
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>⚠️ Flagged Attendance ({records.length})</h3>
        <input type="month" className="form-control" style={{ width: "auto" }} value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      {loading ? <Loader fullPage={false} /> : records.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: "var(--gray-400)" }}>
          <span style={{ fontSize: "32px" }}>✅</span>
          <p style={{ marginTop: "8px" }}>Is mahine koi flagged attendance nahi</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Employee</th><th>Distance</th><th>Selfie</th><th>Status</th></tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r._id}>
                  <td>{r.date}</td>
                  <td style={{ fontWeight: 500 }}>{r.employeeId?.name || r.employeeId?.empId || r.employeeId}</td>
                  <td>
                    <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                      {r.distanceFromSite ?? "—"}m
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--gray-400)", display: "block" }}>site se door</span>
                  </td>
                  <td>
                    {r.selfiePhoto ? (
                      <img
                        src={getAssetUrl(r.selfiePhoto)}
                        alt="selfie"
                        style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--danger)" }}
                      />
                    ) : "—"}
                  </td>
                  <td><Badge type="danger">⚠️ Invalid Location</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FlaggedAttendance;
