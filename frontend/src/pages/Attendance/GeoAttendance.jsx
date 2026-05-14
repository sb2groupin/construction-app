// frontend/src/pages/Attendance/GeoAttendance.jsx
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { attendanceAPI } from "../../api/attendance.api";
import { getAssetUrl } from "../../utils/url.utils";
import { toLocalDateString } from "../../utils/date.utils";
import toast from "react-hot-toast";

const GeoAttendance = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  // States
  const [step, setStep] = useState("idle");
  const [location, setLocation] = useState(null);
  const [locationErr, setLocationErr] = useState(null);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfieURL, setSelfieURL] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState(null);
  const [offlineQueue, setOfflineQueue] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const locationInterval = useRef(null);

  const today = toLocalDateString();
  const timeNow = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const deviceId = localStorage.getItem("deviceId") || `web_${Date.now()}`;
  if (!localStorage.getItem("deviceId")) localStorage.setItem("deviceId", deviceId);

  // Load offline queue from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("attendanceOfflineQueue");
    if (saved) setOfflineQueue(JSON.parse(saved));
  }, []);

  const addToOfflineQueue = (action, data) => {
    const newQueue = [...offlineQueue, { action, data, timestamp: new Date().toISOString() }];
    setOfflineQueue(newQueue);
    localStorage.setItem("attendanceOfflineQueue", JSON.stringify(newQueue));
  };

  // Sync offline records when online
  const syncOfflineRecords = async () => {
    if (!navigator.onLine) return;
    if (offlineQueue.length === 0) return;

    try {
      const res = await attendanceAPI.syncOffline(offlineQueue);
      if (res.data?.synced) {
        toast.success(`${res.data.synced.length} records synced`);
        setOfflineQueue([]);
        localStorage.removeItem("attendanceOfflineQueue");
        await checkTodayAttendance();
      }
    } catch (err) {
      console.error("Sync failed", err);
    }
  };

  useEffect(() => {
    window.addEventListener("online", syncOfflineRecords);
    return () => window.removeEventListener("online", syncOfflineRecords);
  }, [offlineQueue]);

  const checkTodayAttendance = async () => {
    if (!user?.employeeId) {
      setLoading(false);
      return;
    }
    try {
      const res = await attendanceAPI.getMyAttendance({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      const records = res.data?.attendance || [];
      const todayRec = records.find(r => r.date === today);
      setTodayRecord(todayRec || null);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      // If API fails, assume no attendance for today (offline mode)
      setTodayRecord(null);
    } finally {
      setLoading(false);
    }
  };

  // Initialize - wait for auth to load
  useEffect(() => {
    if (authLoading) return;
    if (!user?.employeeId) {
      setLoading(false);
      toast.error("User not authenticated. Please login again.");
      return;
    }
    const init = async () => {
      await checkTodayAttendance();
      await syncOfflineRecords();
    };
    init();
  }, [authLoading, user?.employeeId]);

  // Cleanup camera and interval on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [stream]);

  // Start periodic location updates after check-in
  const startLocationUpdates = () => {
    if (locationInterval.current) clearInterval(locationInterval.current);
    locationInterval.current = setInterval(async () => {
      if (!navigator.onLine) return;
      if (todayRecord && !todayRecord.checkOutTime) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await attendanceAPI.updateLocation({
                employeeId: user.employeeId,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                deviceId: deviceId
              });
            } catch (err) {
              console.error("Location update failed", err);
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        clearInterval(locationInterval.current);
      }
    }, 5 * 60 * 1000); // every 5 minutes
  };

  useEffect(() => {
    if (todayRecord && !todayRecord.checkOutTime && navigator.onLine) {
      startLocationUpdates();
    }
    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [todayRecord]);

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
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        });
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
      toast.error(t("cameraAccessDenied") || "Camera access denied");
      setStep("idle");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        setSelfieBlob(blob);
        setSelfieURL(URL.createObjectURL(blob));
        if (stream) stream.getTracks().forEach(t => t.stop());
        setStream(null);
        setStep("preview");
      },
      "image/jpeg",
      0.8
    );
  };

  const retake = () => {
    setSelfieBlob(null);
    setSelfieURL(null);
    setStep("camera");
    startCamera();
  };

  const submit = async () => {
    if (!selfieBlob || !location) return;
    setStep("submitting");

    const data = {
      employeeId: user.employeeId,
      date: today,
      latitude: location.latitude,
      longitude: location.longitude,
      deviceId: deviceId,
    };

    const isOnline = navigator.onLine;

    try {
      if (isOnline) {
        const res = await attendanceAPI.checkin(data, selfieBlob);
        setTodayRecord(res.data?.attendance);
        setStep("done");
        toast.success("Attendance marked successfully!");
      } else {
        // Offline: store in queue
        addToOfflineQueue("checkin", { ...data, selfie: "stored_offline" });
        setStep("done");
        toast.success("Attendance saved offline. Will sync when online.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.message || "Failed to mark attendance");
      setStep("preview");
    }
  };

  const handleCheckout = async () => {
    const isOnline = navigator.onLine;
    try {
      if (isOnline) {
        const res = await attendanceAPI.checkout({
          employeeId: user.employeeId,
          date: today,
          deviceId: deviceId
        });
        setTodayRecord(res.data?.attendance);
        toast.success(`Check-out done! Hours: ${res.data?.workingHours || 0}`);
      } else {
        addToOfflineQueue("checkout", {
          employeeId: user.employeeId,
          date: today,
          deviceId: deviceId
        });
        toast.success("Check-out saved offline. Will sync when online.");
        // Optimistic update
        setTodayRecord(prev => ({ ...prev, checkOutTime: new Date().toISOString() }));
      }
    } catch (err) {
      toast.error(err.message || "Checkout failed");
    }
  };

  // Render loading state
  if (authLoading || loading) {
    return (
      <div style={styles.center}>
        <div className="spinner" />
        <p style={{ marginTop: 16 }}>Loading...</p>
      </div>
    );
  }

  // User not authenticated
  if (!user?.employeeId) {
    return (
      <div style={styles.center}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h3>Authentication Error</h3>
          <p>Please login again to mark attendance.</p>
          <button className="btn btn-primary" onClick={() => window.location.href = "/login"}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Already checked in today
  if (todayRecord) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>
              {todayRecord.isValidLocation === false ? "⚠️" : "✅"}
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>
              Aaj Ki Attendance Mark Ho Gayi
            </h2>
            <p style={{ color: "var(--gray-400)", fontSize: "14px" }}>{today}</p>

            <div style={{ margin: "20px 0", padding: "16px", background: "var(--gray-50)", borderRadius: "10px", textAlign: "left" }}>
              {[
                ["Status", todayRecord.present ? "✅ Present" : "❌ Absent"],
                ["Check-in", todayRecord.checkInTime ? new Date(todayRecord.checkInTime).toLocaleTimeString("en-IN") : "—"],
                ["Location", todayRecord.isValidLocation ? "✅ Valid" : `⚠️ Invalid (${todayRecord.distanceFromSite}m dur)`],
                ["Selfie", todayRecord.selfiePhoto ? "📷 Captured" : "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--gray-100)", fontSize: "14px" }}>
                  <span style={{ color: "var(--gray-400)" }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            {todayRecord.selfiePhoto && (
              <img
                src={getAssetUrl(todayRecord.selfiePhoto)}
                alt="Selfie"
                style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary)" }}
              />
            )}

            {todayRecord.present && !todayRecord.checkOutTime && (
              <button
                className="btn btn-outline"
                style={{ marginTop: "14px", width: "100%" }}
                onClick={handleCheckout}
              >
                🚪 Check-Out Karo
              </button>
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

  // Main form - step by step
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px" }}>📅 Attendance Mark Karo</h2>
          <p style={{ color: "var(--gray-400)", fontSize: "13px" }}>{today} — {timeNow}</p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "24px" }}>
          {["Location", "Selfie", "Submit"].map((label, i) => {
            const stepIdx = { idle: 0, locating: 0, camera: 1, preview: 1, submitting: 2, done: 3 }[step] || 0;
            const active = i + 1 <= stepIdx;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "12px", fontWeight: 600,
                  background: active ? "var(--primary)" : "var(--gray-200)",
                  color: active ? "white" : "var(--gray-400)", transition: "all .3s"
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: "12px", color: active ? "var(--primary)" : "var(--gray-400)", fontWeight: active ? 500 : 400 }}>
                  {label}
                </span>
                {i < 2 && <div style={{ width: "24px", height: "2px", background: active ? "var(--primary)" : "var(--gray-200)", transition: "all .3s" }} />}
              </div>
            );
          })}
        </div>

        {/* Step: idle */}
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

        {/* Step: locating */}
        {step === "locating" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--gray-600)" }}>Location dhundh raha hoon...</p>
          </div>
        )}

        {/* Step: camera */}
        {step === "camera" && (
          <div>
            {location && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px", fontSize: "13px", color: "#16a34a" }}>
                ✅ Location mili! Accuracy: ±{location.accuracy}m — Ab selfie lo
              </div>
            )}
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "#000", aspectRatio: "4/3" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ width: "160px", height: "200px", border: "2px dashed rgba(255,255,255,0.5)", borderRadius: "50%", boxShadow: "0 0 0 2000px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", padding: "13px", fontSize: "15px", marginTop: "14px" }} onClick={capturePhoto}>
              📷 Photo Lo
            </button>
          </div>
        )}

        {/* Step: preview */}
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

        {/* Step: submitting */}
        {step === "submitting" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--gray-600)" }}>Attendance save ho rahi hai...</p>
          </div>
        )}

        {/* Step: done */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Attendance Mark Ho Gayi!</h3>
            <p style={{ color: "var(--gray-400)", fontSize: "14px", marginTop: "6px" }}>{timeNow} — {today}</p>
            <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
              Refresh
            </button>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

const styles = {
  page:   { padding: "16px", display: "flex", justifyContent: "center" },
  card:   { background: "var(--white)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-md)", width: "100%", maxWidth: "420px" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" },
};

export default GeoAttendance;
