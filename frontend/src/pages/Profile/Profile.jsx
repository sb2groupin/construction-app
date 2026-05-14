import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import styles from "./Profile.module.css";

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    designation: user?.designation || "",
    department: user?.department || "",
  });
  const [imagePreview, setImagePreview] = useState(user?.avatar || null);
  const fileInputRef = useRef();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = t("nameRequired") || "Name is required";
    if (!formData.email?.trim()) newErrors.email = t("emailRequired") || "Email is required";
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = t("invalidEmail") || "Invalid email format";
    }
    if (!formData.phone?.trim()) newErrors.phone = t("phoneRequired") || "Phone is required";
    if (!formData.designation?.trim()) newErrors.designation = t("designationRequired") || "Designation is required";
    if (!formData.department?.trim()) newErrors.department = t("departmentRequired") || "Department is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidImageFormat") || "Invalid image format");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("imageTooLarge") || "Image is too large (max 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error(t("pleaseFillRequiredFields") || "Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const updates = { ...formData };
      if (imagePreview && imagePreview !== user?.avatar) {
        updates.avatar = imagePreview;
      }
      updateProfile(updates);
      toast.success(t("profileUpdated") || "Profile updated successfully");
      setIsEditing(false);
    } catch {
      toast.error(t("updateFailed") || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      designation: user?.designation || "",
      department: user?.department || "",
    });
    setImagePreview(user?.avatar || null);
    setErrors({});
    setIsEditing(false);
  };

  const getUserInitials = () => {
    if (!user?.name) return "JD";
    const names = user.name.split(" ");
    return names.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("myProfile") || "My Profile"}</h1>
          <p className="page-subtitle">{t("manageProfileInfo") || "Manage your complete profile information"}</p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            ✎ {t("editProfile") || "Edit Profile"}
          </button>
        )}
      </div>

      <div className={styles.layout}>
        <div className={`card card-primary ${styles.profileCard}`}>
          <div className={styles.heroBlock}>
            <div className={styles.avatar}>
              {imagePreview ? (
                <img src={imagePreview} alt={user?.name} className={styles.avatarImage} />
              ) : (
                <span className={styles.avatarInitials}>{getUserInitials()}</span>
              )}
            </div>

            <h2 className={styles.userName}>{user?.name || "User"}</h2>
            <p className={styles.userEmail}>{user?.email || "N/A"}</p>
            <div className={styles.roleBadge}>
              {user?.role === "admin" ? t("admin") : t("employee")}
            </div>
          </div>

          <div className={styles.metaSection}>
            <div className={styles.metaItem}>
              <p className={styles.metaLabel}>{t("employeeId")}</p>
              <p className={styles.metaValue}>{user?.employeeId || "N/A"}</p>
            </div>
            <div className={styles.metaItem}>
              <p className={styles.metaLabel}>{t("username")}</p>
              <p className={styles.metaValue}>{user?.username || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className={`card ${styles.formCard}`}>
          {!isEditing ? (
            <div className={styles.detailsGrid}>
              {[
                [t("fullName"), user?.name || "N/A"],
                [t("email"), user?.email || "N/A"],
                [t("phone"), user?.phone || "N/A"],
                [t("designation"), user?.designation || "N/A"],
                [t("department"), user?.department || "N/A"],
              ].map(([label, value]) => (
                <div key={label} className={styles.detailGroup}>
                  <label className={styles.detailLabel}>{label} *</label>
                  <p className={styles.detailValue}>{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h3 className={styles.editHeading}>{t("editProfile")}</h3>

              <div className="form-group">
                <label className="form-label">
                  {t("profilePhoto")}
                  <span className={styles.optionalHint}>({t("optional")})</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={`form-control ${styles.fileInput}`}
                />
                <p className={styles.helperText}>
                  {t("maxFileSize")} 2MB. {t("supportedFormats")}: JPG, PNG, GIF
                </p>
              </div>

              {[
                ["name", "text", t("fullName"), t("enterFullName") || "Enter full name"],
                ["email", "email", t("email"), "email@example.com"],
                ["phone", "tel", t("phone"), "+91 9876543210"],
                ["designation", "text", t("designation"), t("enterDesignation") || "e.g., Site Engineer, Manager"],
                ["department", "text", t("department"), t("enterDepartment") || "e.g., Construction, HR"],
              ].map(([field, type, label, placeholder]) => (
                <div key={field} className="form-group">
                  <label className="form-label">
                    {label} <span className={styles.requiredMark}>*</span>
                  </label>
                  <input
                    type={type}
                    name={field}
                    className={`form-control ${errors[field] ? "error" : ""}`}
                    value={formData[field]}
                    onChange={handleFieldChange}
                    placeholder={placeholder}
                  />
                  {errors[field] && <span className="form-error">{errors[field]}</span>}
                </div>
              ))}

              <div className={styles.actions}>
                <button
                  className="btn btn-outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  {t("cancel")}
                </button>
                <button
                  className={`btn btn-primary ${styles.saveButton}`}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className={styles.inlineSpinner}></span>
                      {t("saving")}
                    </>
                  ) : (
                    <>✓ {t("save")}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
