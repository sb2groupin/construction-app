import { useState, useEffect, useRef } from "react";
import { notificationAPI } from "../../api/extra.api";
import { useNavigate } from "react-router-dom";

const TYPE_ICONS = {
  leave_approved: "✅", leave_rejected: "❌", task_assigned: "📋",
  task_overdue: "⚠️", expense_approved: "✅", expense_rejected: "❌",
  advance_approved: "💵", advance_rejected: "❌", low_stock: "📦",
  flagged_attendance: "📍", quotation_accepted: "📝", notice: "📢",
  incident_reported: "⚠️", material_request: "📋", salary_slip_ready: "💰",
};

const NotificationBell = () => {
  const [open,          setOpen]     = useState(false);
  const [notifications, setNotifs]   = useState([]);
  const [unread,        setUnread]   = useState(0);
  const navigate = useNavigate();
  const ref = useRef();

  const load = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.getUnread(),
      ]);
      setNotifs(notifRes.data.notifications || []);
      setUnread(countRes.data.count || 0);
    } catch (_) {}
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) load();
  };

  const markRead = async (n) => {
    if (!n.isRead) {
      await notificationAPI.markRead(n._id);
      setUnread(u => Math.max(0, u - 1));
      setNotifs(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x));
    }
    if (n.link) { navigate(n.link); setOpen(false); }
  };

  const markAll = async () => {
    await notificationAPI.markAllRead();
    setUnread(0);
    setNotifs(prev => prev.map(x => ({ ...x, isRead: true })));
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "8px", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute", top: "0", right: "0",
            background: "#E24B4A", color: "white", borderRadius: "50%",
            width: "18px", height: "18px", fontSize: "10px", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: "340px", background: "white", borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: "1px solid var(--gray-200)",
          zIndex: 500, maxHeight: "420px", display: "flex", flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontWeight: 600, fontSize: "14px" }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "12px", cursor: "pointer" }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--gray-400)", fontSize: "13px" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔔</div>
                Koi notification nahi
              </div>
            ) : notifications.map(n => (
              <div key={n._id}
                onClick={() => markRead(n)}
                style={{
                  padding: "10px 16px", cursor: "pointer", display: "flex", gap: "10px",
                  background: n.isRead ? "transparent" : "#F0F7FF",
                  borderBottom: "1px solid var(--gray-100)",
                  transition: "background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = n.isRead ? "var(--gray-50)" : "#E8F2FF"}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? "transparent" : "#F0F7FF"}
              >
                <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "2px" }}>
                  {TYPE_ICONS[n.type] || "🔔"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: n.isRead ? 400 : 600, color: "var(--gray-800)", marginBottom: "2px" }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--gray-500)", lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "4px" }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                {!n.isRead && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0, marginTop: "6px" }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
