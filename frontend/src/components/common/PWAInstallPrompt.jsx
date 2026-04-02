import { useState, useEffect } from "react";

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt,     setShowPrompt]     = useState(false);
  const [dismissed,      setDismissed]      = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem("pwa-dismissed")) { setDismissed(true); return; }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem("pwa-dismissed", "1");
    setShowPrompt(false);
    setDismissed(true);
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div style={{
      position: "fixed", bottom: "70px", left: "50%", transform: "translateX(-50%)",
      background: "var(--gray-900)", color: "white", borderRadius: "12px",
      padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 300, maxWidth: "340px", width: "90%",
    }}>
      <span style={{ fontSize: "28px", flexShrink: 0 }}>🏗️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "13px" }}>App Install Karo</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
          Phone pe install karo — offline bhi kaam karega
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <button onClick={install} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>
          Install
        </button>
        <button onClick={dismiss} style={{ background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", fontSize: "11px", cursor: "pointer" }}>
          Later
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
