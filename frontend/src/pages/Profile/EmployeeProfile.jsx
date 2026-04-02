import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { employeeAPI } from "../../api/employee.api";
import { authAPI } from "../../api/auth.api";
import Loader from "../../components/common/Loader";

const EMPTY_PROFILE_FORM = {
  name: "",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  emergencyContact: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  maritalStatus: "",
  photo: "",
  aadharPhoto: "",
  panPhoto: "",
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const buildProfileForm = (employee) => ({
  name: employee?.name || "",
  phone: employee?.phone || "",
  alternatePhone: employee?.alternatePhone || "",
  email: employee?.email || "",
  address: employee?.address || "",
  emergencyContact: employee?.emergencyContact || "",
  dateOfBirth: toDateInput(employee?.dateOfBirth),
  gender: employee?.gender || "",
  bloodGroup: employee?.bloodGroup || "",
  maritalStatus: employee?.maritalStatus || "",
  photo: employee?.photo || "",
  aadharPhoto: employee?.aadharPhoto || "",
  panPhoto: employee?.panPhoto || "",
});

const DocumentCard = ({ title, hint, preview, onUpload }) => (
  <div
    style={{
      border: "1px solid var(--border)",
      borderRadius: "18px",
      padding: "16px",
      background: "linear-gradient(180deg, #fffdf8 0%, #ffffff 100%)",
      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
    }}
  >
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{hint}</div>
    </div>

    <div
      style={{
        minHeight: "150px",
        borderRadius: "14px",
        border: "1px dashed rgba(249, 115, 22, 0.3)",
        background: "rgba(249, 115, 22, 0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        marginBottom: "12px",
      }}
    >
      {preview ? (
        <img
          src={preview}
          alt={title}
          style={{ width: "100%", height: "150px", objectFit: "cover" }}
        />
      ) : (
        <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
          <div style={{ fontSize: "30px", marginBottom: "6px" }}>+</div>
          <div>No document uploaded</div>
        </div>
      )}
    </div>

    <input
      type="file"
      accept="image/*"
      className="form-control"
      onChange={onUpload}
    />
  </div>
);

const EmployeeProfile = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_PROFILE_FORM);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const fileReadersRef = useRef([]);

  useEffect(() => {
    let active = true;

    const loadEmployee = async () => {
      if (!user?.employeeId) {
        if (active) setLoading(false);
        return;
      }

      try {
        const res = await employeeAPI.getOne(user.employeeId);
        const nextEmployee = res.data.employee;

        if (!active) return;

        setEmployee(nextEmployee);
        setForm(buildProfileForm(nextEmployee));
      } catch (error) {
        toast.error(error.message || "Profile load failed");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadEmployee();

    return () => {
      active = false;
      fileReadersRef.current.forEach((reader) => {
        if (reader.readyState === 1) {
          reader.abort();
        }
      });
    };
  }, [user?.employeeId]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("File size should be under 3MB");
      return;
    }

    const reader = new FileReader();
    fileReadersRef.current.push(reader);
    reader.onload = () => {
      handleFieldChange(field, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const validateProfile = () => {
    if (!form.name.trim()) {
      toast.error(t("nameRequired") || "Name is required");
      return false;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error(t("invalidEmail") || "Please enter a valid email");
      return false;
    }

    return true;
  };

  const saveProfile = async () => {
    if (!validateProfile() || !user?.employeeId) return;

    setSavingProfile(true);
    try {
      const payload = {
        ...form,
        dateOfBirth: form.dateOfBirth || null,
      };

      const res = await employeeAPI.update(user.employeeId, payload);
      const updatedEmployee = res.data.employee;

      setEmployee(updatedEmployee);
      setForm(buildProfileForm(updatedEmployee));
      updateProfile({
        name: updatedEmployee.name,
        avatar: updatedEmployee.photo,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone,
        designation: updatedEmployee.designation,
      });

      toast.success(t("profileUpdated") || "Profile updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password should match");
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <Loader fullPage={false} />;

  if (!employee) {
    return (
      <div className="page-content">
        <div className="card">
          <p style={{ color: "var(--text-secondary)" }}>Employee profile not found. Please contact admin.</p>
        </div>
      </div>
    );
  }

  const initials = employee.name?.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2) || "EM";
  const salaryLabel = employee.salaryType === "monthly"
    ? `\u20B9${(employee.monthlySalary || 0).toLocaleString("en-IN")} / month`
    : `\u20B9${employee.dailyWage || 0} / day`;

  return (
    <div className="page-content employee-profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("myProfile") || "My Profile"}</h1>
          <p className="page-subtitle">Update your personal info, documents, and security details</p>
        </div>
        <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}>
          {savingProfile ? (t("loading") || "Saving...") : (t("save") || "Save")}
        </button>
      </div>

      <div className="employee-profile-layout">
        <div className="employee-profile-main">
          <div
            className="card card-primary employee-profile-hero"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
              padding: "24px",
            }}
          >
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "28px",
                background: employee.photo
                  ? "transparent"
                  : "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(251,146,60,0.38))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--primary)",
                flexShrink: 0,
              }}
            >
              {employee.photo ? (
                <img src={employee.photo} alt={employee.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials
              )}
            </div>

            <div style={{ flex: 1, minWidth: "220px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>{employee.name}</div>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px" }}>
                {employee.designation || "Employee"} {" - "} {employee.empId}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                <span className="badge badge-primary">{employee.projectId?.name || "Project not assigned"}</span>
                <span className="badge badge-warning">{salaryLabel}</span>
              </div>
            </div>

            <div className="employee-profile-photo-upload" style={{ width: "220px", maxWidth: "100%" }}>
              <label className="form-label">{t("profilePhoto") || "Profile Photo"}</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={handleFileUpload("photo")}
              />
            </div>
          </div>

          <div className="card" style={{ padding: "24px" }}>
            <div className="card-header" style={{ marginBottom: "20px" }}>
              <div>
                <h3 className="card-title">Personal Information</h3>
                <p className="card-subtitle">Keep your profile and emergency details up to date</p>
              </div>
            </div>

            <div className="form-grid employee-personal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">{t("name") || "Name"} *</label>
                <input className="form-control" value={form.name} onChange={(e) => handleFieldChange("name", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">{t("phone") || "Phone"}</label>
                <input className="form-control" value={form.phone} onChange={(e) => handleFieldChange("phone", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Alternate Phone</label>
                <input className="form-control" value={form.alternatePhone} onChange={(e) => handleFieldChange("alternatePhone", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">{t("email") || "Email"}</label>
                <input className="form-control" value={form.email} onChange={(e) => handleFieldChange("email", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-control" value={form.dateOfBirth} onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-control" value={form.gender} onChange={(e) => handleFieldChange("gender", e.target.value)}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-control" value={form.bloodGroup} onChange={(e) => handleFieldChange("bloodGroup", e.target.value)}>
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Marital Status</label>
                <select className="form-control" value={form.maritalStatus} onChange={(e) => handleFieldChange("maritalStatus", e.target.value)}>
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">{t("address") || "Address"}</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={form.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">{t("emergencyContact") || "Emergency Contact"}</label>
                <input className="form-control" value={form.emergencyContact} onChange={(e) => handleFieldChange("emergencyContact", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "24px" }}>
            <div className="card-header" style={{ marginBottom: "20px" }}>
              <div>
                <h3 className="card-title">Documents</h3>
                <p className="card-subtitle">Upload the important identity documents you want on your profile</p>
              </div>
            </div>

            <div className="employee-doc-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <DocumentCard
                title="Aadhaar Card"
                hint="Upload front-side photo or scan"
                preview={form.aadharPhoto}
                onUpload={handleFileUpload("aadharPhoto")}
              />
              <DocumentCard
                title="PAN Card"
                hint="Upload PAN image or scan"
                preview={form.panPhoto}
                onUpload={handleFileUpload("panPhoto")}
              />
            </div>
          </div>
        </div>

        <div className="employee-profile-side">
          <div className="card" style={{ padding: "24px" }}>
            <div className="card-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 className="card-title">Employment Details</h3>
                <p className="card-subtitle">Read-only job information from admin records</p>
              </div>
            </div>

            {[
              ["Employee ID", employee.empId],
              ["Designation", employee.designation || "Employee"],
              ["Project", employee.projectId?.name || "Not assigned"],
              ["Salary Type", employee.salaryType === "monthly" ? "Monthly" : "Daily Wage"],
              ["Salary", salaryLabel],
              ["Joining Date", employee.joinDate ? new Date(employee.joinDate).toLocaleDateString("en-IN") : "--"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(229, 231, 235, 0.8)",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: "24px" }}>
            <div className="card-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 className="card-title">Change Password</h3>
                <p className="card-subtitle">Use a strong password with number and special character</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>

            <button className="btn btn-outline" onClick={changePassword} disabled={changingPassword}>
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
