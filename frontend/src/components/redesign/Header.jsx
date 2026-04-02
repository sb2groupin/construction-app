import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../common/LanguageSwitcher';

const RedesignHeader = ({ onMenuToggle }) => {
  const { t } = useTranslation();
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const getUserInitials = () => {
    if (!user?.name) return 'JD';
    const names = user.name.split(' ');
    return names.map((name) => name[0]).join('').toUpperCase().slice(0, 2);
  };

  const companyName = company?.companyName || company?.name || t('buildCo');
  const companyLogo = company?.logo || company?.companyLogo;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate(user?.role === 'employee' ? '/my-profile' : '/profile');
    setShowProfileDropdown(false);
  };

  return (
    <header className="redesign-header">
      <div className="header-left">
        {/* Hamburger Button - Yeh ab Header mein hai */}
        <button
          type="button"
          className="hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <span className="hamburger-icon">{'\u2630'}</span>
        </button>

        {/* Company Info */}
        <div className="header-company-info">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="header-company-logo"
            />
          ) : (
            <span className="header-company-icon">🏢</span>
          )}

          <div className="header-company-details">
            <div className="header-company-name">{companyName}</div>
            <div className="header-company-tagline">{company?.tagline || t('construction')}</div>
          </div>
        </div>
      </div>

      <div className="header-right">
        <LanguageSwitcher />

        <div className="profile-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="profile-button"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            title={user?.name || 'Profile'}
          >
            <div className="avatar-small">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                getUserInitials()
              )}
            </div>
            <span className="profile-name">{user?.name || 'User'}</span>
            <span className="dropdown-arrow">▼</span>
          </button>

          {showProfileDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="avatar-large">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    getUserInitials()
                  )}
                </div>

                <div className="dropdown-user-info">
                  <div className="dropdown-name">{user?.name || 'User'}</div>
                  <div className="dropdown-username">{user?.username}</div>
                  <div className="dropdown-role">
                    {user?.role === 'admin' ? t('admin') : t('employee')}
                  </div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <button
                type="button"
                className="dropdown-item"
                onClick={handleProfileClick}
              >
                👤 <span>{t('myProfile')}</span>
              </button>

              <div className="dropdown-divider"></div>

              <button
                type="button"
                className="dropdown-item dropdown-logout"
                onClick={handleLogout}
              >
                🚪 <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default RedesignHeader;