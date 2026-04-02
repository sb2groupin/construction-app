import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    designation: user?.designation || '',
    department: user?.department || '',
  });
  const [imagePreview, setImagePreview] = useState(user?.avatar || null);
  const fileInputRef = useRef();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = t('nameRequired') || 'Name is required';
    if (!formData.email?.trim()) newErrors.email = t('emailRequired') || 'Email is required';
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = t('invalidEmail') || 'Invalid email format';
    }
    if (!formData.phone?.trim()) newErrors.phone = t('phoneRequired') || 'Phone is required';
    if (!formData.designation?.trim()) newErrors.designation = t('designationRequired') || 'Designation is required';
    if (!formData.department?.trim()) newErrors.department = t('departmentRequired') || 'Department is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('invalidImageFormat') || 'Invalid image format');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('imageTooLarge') || 'Image is too large (max 2MB)');
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
      toast.error(t('pleaseFillRequiredFields') || 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const updates = { ...formData };
      if (imagePreview && imagePreview !== user?.avatar) {
        updates.avatar = imagePreview;
      }
      updateProfile(updates);
      toast.success(t('profileUpdated') || 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(t('updateFailed') || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      designation: user?.designation || '',
      department: user?.department || '',
    });
    setImagePreview(user?.avatar || null);
    setErrors({});
    setIsEditing(false);
  };

  const getUserInitials = () => {
    if (!user?.name) return 'JD';
    const names = user.name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('myProfile') || 'My Profile'}</h1>
          <p className="page-subtitle">{t('manageProfileInfo') || 'Manage your complete profile information'}</p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            ✎ {t('editProfile') || 'Edit Profile'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Profile Card - Left Side */}
        <div className="card card-primary" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <div className="avatar-profile-large" style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '56px',
              fontWeight: '700',
              color: 'var(--primary)',
              overflow: 'hidden',
              border: '4px solid var(--primary)',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)'
            }}>
              {imagePreview ? (
                <img src={imagePreview} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getUserInitials()
              )}
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              {user?.name || 'User'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
              {user?.email || 'N/A'}
            </p>
            <div style={{
              display: 'inline-block',
              padding: '6px 14px',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              color: 'var(--primary)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {user?.role === 'admin' ? t('admin') : t('employee')}
            </div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600' }}>
                {t('employeeId')}
              </p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {user?.employeeId || 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600' }}>
                {t('username')}
              </p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {user?.username || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Form - Right Side */}
        <div className="card" style={{ padding: '32px' }}>
          {!isEditing ? (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px' }}>
                  {t('fullName')} *
                </label>
                <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {user?.name || 'N/A'}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px' }}>
                  {t('email')} *
                </label>
                <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {user?.email || 'N/A'}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px' }}>
                  {t('phone')} *
                </label>
                <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {user?.phone || 'N/A'}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px' }}>
                  {t('designation')} *
                </label>
                <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {user?.designation || 'N/A'}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px' }}>
                  {t('department')} *
                </label>
                <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {user?.department || 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
                {t('editProfile')}
              </h3>

              <div className="form-group">
                <label className="form-label">
                  {t('profilePhoto')}
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '400', marginLeft: '4px' }}>
                    ({t('optional')})
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="form-control"
                  style={{ cursor: 'pointer' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  {t('maxFileSize')} 2MB. {t('supportedFormats')}: JPG, PNG, GIF
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('fullName')} <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className={`form-control ${errors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={handleFieldChange}
                  placeholder={t('enterFullName') || 'Enter full name'}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('email')} <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${errors.email ? 'error' : ''}`}
                  value={formData.email}
                  onChange={handleFieldChange}
                  placeholder="email@example.com"
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('phone')} <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className={`form-control ${errors.phone ? 'error' : ''}`}
                  value={formData.phone}
                  onChange={handleFieldChange}
                  placeholder="+91 9876543210"
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('designation')} <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>
                </label>
                <input
                  type="text"
                  name="designation"
                  className={`form-control ${errors.designation ? 'error' : ''}`}
                  value={formData.designation}
                  onChange={handleFieldChange}
                  placeholder={t('enterDesignation') || 'e.g., Site Engineer, Manager'}
                />
                {errors.designation && <span className="form-error">{errors.designation}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('department')} <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  className={`form-control ${errors.department ? 'error' : ''}`}
                  value={formData.department}
                  onChange={handleFieldChange}
                  placeholder={t('enterDepartment') || 'e.g., Construction, HR'}
                />
                {errors.department && <span className="form-error">{errors.department}</span>}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  {t('cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ minWidth: '120px' }}
                >
                  {saving ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
                      {t('saving')}
                    </>
                  ) : (
                    <>✓ {t('save')}</>
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
