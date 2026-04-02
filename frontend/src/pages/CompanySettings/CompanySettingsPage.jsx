import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { settingsAPI } from "../../api/settings.api";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

const Section = ({ title, children }) => (
  <div style={{ marginBottom: "24px" }}>
    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid var(--gray-200)" }}>
      {title}
    </div>
    {children}
  </div>
);

const CompanySettingsPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    companyName: "", address: "", phone: "", email: "", gstNumber: "",
    logo: "",
    overtimeThresholdHours: 8, overtimeRateMultiplier: 1.5, halfDayCutoffHours: 4,
    defaultGeoFenceRadius: 500,
    sickLeavePerYear: 12, casualLeavePerYear: 12, earnedLeavePerYear: 15,
    otpMethod: "email", pdfFooterText: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    settingsAPI.get().then(res => {
      const s = res.data.settings;
      if (s) setForm(f => ({ ...f, ...s }));
    }).catch(() => toast.error(t("loadError")))
      .finally(() => setLoading(false));
  }, []);

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }));

  // Handle logo file upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({ ...prev, logo: event.target?.result }));
      toast.success('Logo uploaded successfully');
    };
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(form);
      toast.success(t("updateSuccess"));
    } catch { toast.error(t("saveError")); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader fullPage={false} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">{t("companySettingsTitle")}</h1><p className="page-subtitle">{t("companySettingsSubtitle")}</p></div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "💾 Save All Settings"}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Left column */}
        <div>
          <div className="card">
            <Section title="🏢 Company Information">
              <div className="form-group"><label className="form-label">{t("companyNameLabel")}</label><input className="form-control" placeholder={t("placeholderOrganization")} value={form.companyName} onChange={f("companyName")} /></div>
              <div className="form-group"><label className="form-label">{t("gstNumberLabel")}</label><input className="form-control" placeholder={t("placeholderGST")} value={form.gstNumber} onChange={f("gstNumber")} /></div>
              <div className="form-group"><label className="form-label">{t("phoneFieldLabel")}</label><input className="form-control" placeholder={t("placeholderPhone")} value={form.phone} onChange={f("phone")} /></div>
              <div className="form-group"><label className="form-label">{t("emailFieldLabel")}</label><input className="form-control" type="email" placeholder={t("placeholderEmail")} value={form.email} onChange={f("email")} /></div>
              <div className="form-group"><label className="form-label">{t("addressLabel")}</label><textarea className="form-control" rows={2} placeholder={t("placeholderAddress")} value={form.address} onChange={f("address")} /></div>
              <div className="form-group">
                <label className="form-label">🖼️ Upload Company Logo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="form-control" 
                  onChange={handleLogoUpload}
                  style={{ padding: "8px", cursor: "pointer" }}
                />
                <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "4px" }}>Supported: JPG, PNG, GIF, SVG (Max 2MB)</div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("companyLogoURLLabel")}</label>
                <input className="form-control" placeholder="https://res.cloudinary.com/..." value={form.logo || ""} onChange={f("logo")} />
                <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "4px" }}>{t("cloudinaryUploadNote")}</div>
              </div>
              {form.logo && (
                <div style={{ marginTop: "12px", padding: "12px", background: "var(--primary-light)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>Logo Preview:</div>
                  <img src={form.logo} alt="logo preview" style={{ height: "60px", objectFit: "contain", background: "white", borderRadius: "6px", padding: "6px" }} />
                </div>
              )}
              <div className="form-group"><label className="form-label">{t("pdfFooterTextLabel")}</label><input className="form-control" placeholder={t("placeholderPdfFooter")} value={form.pdfFooterText || ""} onChange={f("pdfFooterText")} /></div>
            </Section>
          </div>

          <div className="card" style={{ marginTop: "16px" }}>
            <Section title="📅 Leave Entitlement (Per Year)">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">{t("sickLeaveLabel")}</label><input type="number" className="form-control" min="0" value={form.sickLeavePerYear} onChange={f("sickLeavePerYear")} /></div>
                <div className="form-group"><label className="form-label">{t("casualLeaveLabel")}</label><input type="number" className="form-control" min="0" value={form.casualLeavePerYear} onChange={f("casualLeavePerYear")} /></div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}><label className="form-label">{t("earnedLeaveLabel")}</label><input type="number" className="form-control" min="0" value={form.earnedLeavePerYear} onChange={f("earnedLeavePerYear")} /></div>
              </div>
            </Section>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="card">
            <Section title="💰 {t('payrollSettingsTitle').replace('💰 ', '')}">
              <div style={{ padding: "10px 12px", background: "#FAEEDA", borderRadius: "8px", marginBottom: "14px", fontSize: "12px", color: "#633806" }}>
                {t("payrollSettingsNote")}
              </div>
              <div className="form-group">
                <label className="form-label">{t("overtimeThresholdHours")}</label>
                <input type="number" step="0.5" className="form-control" min="1" max="24" value={form.overtimeThresholdHours} onChange={f("overtimeThresholdHours")} />
                <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "4px" }}>{t("overtimeThresholdNote")}</div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("overtimeRateMultiplierLabel")}</label>
                <input type="number" step="0.1" className="form-control" min="1" max="3" value={form.overtimeRateMultiplier} onChange={f("overtimeRateMultiplier")} />
                <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "4px" }}>{t("overtimeRateNote")}</div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("halfDayCutoffHours")}</label>
                <input type="number" step="0.5" className="form-control" min="1" max="12" value={form.halfDayCutoffHours} onChange={f("halfDayCutoffHours")} />
                <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "4px" }}>{t("halfDayNote")}</div>
              </div>
            </Section>

            <Section title="📍 {t('geoFenceSettingsTitle').replace('📍 ', '')}">
              <div className="form-group">
                <label className="form-label">{t("defaultGeoFenceRadiusLabel")}</label>
                <input type="number" className="form-control" min="50" max="5000" value={form.defaultGeoFenceRadius} onChange={f("defaultGeoFenceRadius")} />
                <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "4px" }}>Global default — individual sites pe override ho sakta hai</div>
              </div>
              <div style={{ padding: "10px 12px", background: "var(--gray-50)", borderRadius: "8px", fontSize: "12px", color: "var(--gray-600)" }}>
                <strong>Current:</strong> {form.defaultGeoFenceRadius}m radius · ~{(form.defaultGeoFenceRadius * 3.14159 * 2 / 1000).toFixed(2)}km circumference
              </div>
            </Section>

            <Section title="🔔 Notification Settings">
              <div className="form-group">
                <label className="form-label">{t("otpDeliveryMethodLabel")}</label>
                <select className="form-control" value={form.otpMethod} onChange={f("otpMethod")}>
                  <option value="email">Email only</option>
                  <option value="sms">SMS only (Twilio)</option>
                  <option value="both">Both — Email + SMS</option>
                </select>
              </div>
              {(form.otpMethod === "sms" || form.otpMethod === "both") && (
                <div style={{ padding: "10px 12px", background: "#FAEEDA", borderRadius: "8px", fontSize: "12px", color: "#633806" }}>
                  SMS ke liye Twilio credentials .env mein add karo: TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* Save button at bottom too */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
        <button className="btn btn-primary" style={{ padding: "12px 28px" }} onClick={save} disabled={saving}>
          {saving ? "Saving..." : "💾 Save All Settings"}
        </button>
      </div>
    </div>
  );
};

export default CompanySettingsPage;
