import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios.config";
import toast from "react-hot-toast";

const GeoAttendance = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // States
  const [step,         setStep]         = useState("idle"); // idle | locating | camera | preview | submitting | done
  const [location,     setLocation]     = useState(null);
  const [locationErr,  setLocationErr]  = useState(null);
  const [selfieBlob,   setSelfieBlob]   = useState(null);
  const [selfieURL,    setSelfieURL]    = useState(null);
  const [todayRecord,  setTodayRecord]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [stream,       setStream]       = useState(null);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];
  const timeNow = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // Check karo aaj ki attendance already hai?
  useEffect(() => {
    const checkToday = async () => {
      try {
        const res = await api.get("/attendance", { params: { month: new Date().getMonth() + 1, year: new Date().getFullYear() } });
        const records = res.data?.attendance || [];
        const todayRec = records.find(r => r.date === today);
        setTodayRecord(todayRec || null);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    checkToday();
  }, []);

  // Camera stop karo jab component unmount ho
  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [stream]);

  // Step 1: Location lo
  const getLocation = () => {
    setStep("locating");
    setLocationErr(null);

    if (!navigator.geolocation) {
      setLocationErr("Ye browser geolocation support nahi karta");
      setStep("idle");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) });
        setStep("camera");
        startCamera();
      },
      (err) => {
        const msgs = {
          1: "Location permission denied. Browser settings mein allow karo.",
          2: "Location unavailable. GPS check karo.",
          3: "Location timeout. Dobara try karo.",
        };
        setLocationErr(msgs[err.code] || "Location error");
        setStep("idle");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Step 2: Camera kholo
  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(s);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = s;
      }, 100);
    } catch (err) {
      toast.error(t("cameraAccessDenied"));
      setStep("idle");
    }
  };

  // Step 3: Photo lo
  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setSelfieBlob(blob);
      setSelfieURL(URL.createObjectURL(blob));
      // Camera band karo
      stream?.getTracks().forEach(t => t.stop());
      setStream(null);
      setStep("preview");
    }, "image/jpeg", 0.8);
  };

  // Retake
  const retake = () => {
    setSelfieBlob(null);
    setSelfieURL(null);
    setStep("camera");
    startCamera();
  };

  // Step 4: Submit
  const submit = async () => {
    if (!selfieBlob || !location) return;
    setStep("submitting");

    const formData = new FormData();
    formData.append("employeeId", user.employeeId);
    formData.append("date",       today);
    formData.append("present",    "true");
    formData.append("latitude",   location.latitude);
    formData.append("longitude",  location.longitude);
    formData.append("selfie",     selfieBlob, "selfie.jpg");

    try {
      const res = await api.post("/attendance", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const geoValid = res.data?.geoValid;
      setTodayRecord(res.data?.attendance);
      setStep("done");

      if (geoValid === false) {
        toast(t("attendanceWarning"), { icon: "⚠️", duration: 5000 });
      } else {
        toast.success(t("attendanceSuccess"));
      }
    } catch (err) {
      toast.error(err.message || t("attendanceError"));
      setStep("preview");
    }
  };

  // ── Render ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.center}>
        <div className="spinner" />
      </div>
    );
  }

  // Already checked in
  if (todayRecord) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>
              {todayRecord.location?.isValid === false ? "⚠️" : "✅"}
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>
              Aaj ki Attendance Mark Ho Gayi
            </h2>
            <p style={{ color: "var(--gray-400)", fontSize: "14px" }}>{today}</p>

            <div style={{ margin: "20px 0", padding: "16px", background: "var(--gray-50)", borderRadius: "10px", textAlign: "left" }}>
              {[
                ["Status",    todayRecord.present ? "✅ Present" : "❌ Absent"],
                ["Check-in",  todayRecord.checkInTime ? new Date(todayRecord.checkInTime).toLocaleTimeString("en-IN") : "—"],
                ["Location",  todayRecord.location?.isValid ? "✅ Valid" : `⚠️ Invalid (${todayRecord.location?.distanceFromSite}m dur)`],
                ["Selfie",    todayRecord.selfiePhoto ? "📷 Captured" : "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--gray-100)", fontSize: "14px" }}>
                  <span style={{ color: "var(--gray-400)" }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            {todayRecord.selfiePhoto && (
              <img
                src={`http://localhost:5000${todayRecord.selfiePhoto}`}
                alt="Selfie"
                style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary)" }}
              />
            )}

            {/* Checkout button */}
            {todayRecord.present && !todayRecord.checkOutTime && (
              <CheckOutButton employeeId={user.employeeId} date={today} onDone={(rec) => setTodayRecord(rec)} />
            )}
            {todayRecord.checkOutTime && (
              <div style={{ marginTop: "14px", padding: "10px", background: "#f0fdf4", borderRadius: "8px", fontSize: "14px" }}>
                ✅ Check-out: {new Date(todayRecord.checkOutTime).toLocaleTimeString("en-IN")}
                {todayRecord.workingHours && ` — ${todayRecord.workingHours} hrs`}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px" }}>📅 Attendance Mark Karo</h2>
          <p style={{ color: "var(--gray-400)", fontSize: "13px" }}>{today} — {timeNow}</p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "24px" }}>
          {["Location", "Selfie", "Submit"].map((label, i) => {
            const stepIdx = { idle: 0, locating: 0, camera: 1, preview: 1, submitting: 2, done: 3 }[step] || 0;
            const active  = i + 1 <= stepIdx;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, background: active ? "var(--primary)" : "var(--gray-200)", color: active ? "white" : "var(--gray-400)", transition: "all .3s" }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: "12px", color: active ? "var(--primary)" : "var(--gray-400)", fontWeight: active ? 500 : 400 }}>{label}</span>
                {i < 2 && <div style={{ width: "24px", height: "2px", background: active ? "var(--primary)" : "var(--gray-200)", transition: "all .3s" }} />}
              </div>
            );
          })}
        </div>

        {/* ── IDLE ── */}
        {step === "idle" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📍</div>
            <p style={{ color: "var(--gray-600)", marginBottom: "20px", fontSize: "14px", lineHeight: 1.6 }}>
              Attendance ke liye pehle aapki location verify hogi,<br/>phir selfie lete hain.
            </p>
            {locationErr && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px", color: "#dc2626" }}>
                ⚠️ {locationErr}
              </div>
            )}
            <button className="btn btn-primary" style={{ width: "100%", padding: "13px", fontSize: "15px" }} onClick={getLocation}>
              📍 Location Allow Karo & Shuru Karo
            </button>
          </div>
        )}

        {/* ── LOCATING ── */}
        {step === "locating" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--gray-600)" }}>Location dhundh raha hoon...</p>
          </div>
        )}

        {/* ── CAMERA ── */}
        {step === "camera" && (
          <div>
            {location && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px", fontSize: "13px", color: "#16a34a" }}>
                ✅ Location mili! Accuracy: ±{location.accuracy}m — Ab selfie lo
              </div>
            )}
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "#000", aspectRatio: "4/3" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              {/* Face guide overlay */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ width: "160px", height: "200px", border: "2px dashed rgba(255,255,255,0.5)", borderRadius: "50%", boxShadow: "0 0 0 2000px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", padding: "13px", fontSize: "15px", marginTop: "14px" }}
              onClick={capturePhoto}
            >
              📷 Photo Lo
            </button>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {step === "preview" && selfieURL && (
          <div style={{ textAlign: "center" }}>
            <img src={selfieURL} alt="Selfie" style={{ width: "180px", height: "180px", borderRadius: "50%", objectFit: "cover", border: "4px solid var(--primary)", marginBottom: "16px" }} />
            {location && (
              <div style={{ background: "var(--gray-50)", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--gray-400)" }}>Latitude</span>
                  <span style={{ fontFamily: "monospace" }}>{location.latitude.toFixed(6)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--gray-400)" }}>Longitude</span>
                  <span style={{ fontFamily: "monospace" }}>{location.longitude.toFixed(6)}</span>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={retake}>↩ Retake</button>
              <button className="btn btn-success" style={{ flex: 1, padding: "11px" }} onClick={submit}>
                ✅ Submit Attendance
              </button>
            </div>
          </div>
        )}

        {/* ── SUBMITTING ── */}
        {step === "submitting" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--gray-600)" }}>Attendance save ho rahi hai...</p>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Attendance Mark Ho Gayi!</h3>
            <p style={{ color: "var(--gray-400)", fontSize: "14px", marginTop: "6px" }}>{timeNow} — {today}</p>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

// ── Check-Out Button Component ────────────────────────
const CheckOutButton = ({ employeeId, date, onDone }) => {
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    setLoading(true);
    try {
      const res = await api.post("/attendance/checkout", { employeeId, date });
      toast.success(t("checkoutSuccess", { hours: res.data?.attendance?.workingHours || "—" }));
      onDone(res.data?.attendance);
    } catch (err) {
      toast.error(err.message || t("checkoutFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-outline"
      style={{ marginTop: "14px", width: "100%" }}
      onClick={checkout}
      disabled={loading}
    >
      {loading ? "..." : "🚪 Check-Out Karo"}
    </button>
  );
};

const styles = {
  page:   { padding: "16px", display: "flex", justifyContent: "center" },
  card:   { background: "var(--white)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-md)", width: "100%", maxWidth: "420px" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" },
};

export default GeoAttendance;
