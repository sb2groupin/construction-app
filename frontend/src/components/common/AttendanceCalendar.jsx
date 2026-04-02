import { useState, useEffect } from "react";
import { attendanceAPI } from "../../api/attendance.api";
import Loader from "./Loader";

const AttendanceCalendar = ({ employeeId, isReadOnly = false }) => {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [month,    setMonth]    = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (!employeeId) { setLoading(false); return; }
    const [y, m] = month.split("-");
    setLoading(true);
    attendanceAPI.getAll({ employeeId, month: m, year: y })
      .then(res => setRecords(res.data.attendance || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [employeeId, month]);

  const [year, mon] = month.split("-").map(Number);
  const firstDay  = new Date(year, mon - 1, 1).getDay();
  const daysInMonth = new Date(year, mon, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const recordMap = {};
  records.forEach(r => { recordMap[r.date] = r; });

  const getStatus = (day) => {
    const dateStr = `${year}-${String(mon).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const r = recordMap[dateStr];
    if (!r) return "none";
    if (!r.present)    return "absent";
    if (r.isHalfDay)   return "half";
    return "present";
  };

  const STATUS_STYLE = {
    present: { bg: "#dcfce7", color: "#15803d", border: "#86efac" },
    absent:  { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
    half:    { bg: "#fef9c3", color: "#ca8a04", border: "#fde047" },
    none:    { bg: "transparent", color: "var(--gray-600)", border: "var(--gray-200)" },
    today:   { bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
  };

  const present  = records.filter(r => r.present && !r.isHalfDay).length;
  const half     = records.filter(r => r.isHalfDay).length;
  const absent   = records.filter(r => !r.present).length;

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          style={{ border: "1px solid var(--gray-200)", borderRadius: "6px", padding: "5px 10px", fontSize: "13px" }} />
        <div style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
          <span style={{ padding: "3px 10px", background: "#dcfce7", color: "#15803d", borderRadius: "6px" }}>✅ Present: {present}</span>
          <span style={{ padding: "3px 10px", background: "#fef9c3", color: "#ca8a04", borderRadius: "6px" }}>🌗 Half: {half}</span>
          <span style={{ padding: "3px 10px", background: "#fee2e2", color: "#dc2626", borderRadius: "6px" }}>❌ Absent: {absent}</span>
        </div>
      </div>

      {loading ? <Loader fullPage={false} /> : (
        <>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, color: "var(--gray-400)", padding: "4px" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = `${year}-${String(mon).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const status  = getStatus(day);
              const isToday = dateStr === today;
              const style   = isToday && status === "none" ? STATUS_STYLE.today : STATUS_STYLE[status];
              const r       = recordMap[dateStr];

              return (
                <div key={day} title={r ? `${r.present ? (r.isHalfDay ? "Half Day" : "Present") : "Absent"}${r.location?.isValid === false ? " ⚠️ Invalid Location" : ""}` : ""}
                  style={{
                    textAlign: "center", padding: "6px 2px", borderRadius: "6px", cursor: "default",
                    background: style.bg, color: style.color, border: `1px solid ${style.border}`,
                    fontSize: "13px", fontWeight: isToday ? 700 : 400, position: "relative",
                    minHeight: "36px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {day}
                  {r?.location?.isValid === false && (
                    <span style={{ position: "absolute", top: "1px", right: "2px", fontSize: "8px" }}>⚠️</span>
                  )}
                  {r?.selfiePhoto && (
                    <span style={{ position: "absolute", bottom: "1px", right: "2px", fontSize: "7px" }}>📷</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", fontSize: "11px", color: "var(--gray-500)", flexWrap: "wrap" }}>
            <span>⚠️ = Invalid location</span>
            <span>📷 = Selfie captured</span>
            <span style={{ background: "#eff6ff", padding: "1px 6px", borderRadius: "4px", color: "#1d4ed8" }}>Today</span>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceCalendar;
