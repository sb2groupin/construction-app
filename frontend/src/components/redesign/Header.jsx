import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../common/LanguageSwitcher';
import styles from './Header.module.css';

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
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <span className={styles.menuIcon}>{'\u2630'}</span>
        </button>

        <div className={styles.companyInfo}>
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className={styles.companyLogo}
            />
          ) : (
            <span className={styles.companyIcon}>{"\u{1F3E2}"}</span>
          )}

          <div className={styles.companyDetails}>
            <div className={styles.companyName}>{companyName}</div>
            <div className={styles.companyTagline}>{company?.tagline || t('construction')}</div>
          </div>
        </div>
      </div>

      <div className={styles.rightSection}>
        <LanguageSwitcher />

        <div className={styles.profileDropdown} ref={dropdownRef}>
          <button
            type="button"
            className={styles.profileButton}
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            title={user?.name || 'Profile'}
          >
            <div className={styles.avatarSmall}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                getUserInitials()
              )}
            </div>
            <span className={styles.profileName}>{user?.name || 'User'}</span>
            <span className={styles.dropdownArrow}>{"\u25BE"}</span>
          </button>

          {showProfileDropdown && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <div className={styles.avatarLarge}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    getUserInitials()
                  )}
                </div>

                <div className={styles.dropdownUserInfo}>
                  <div className={styles.dropdownName}>{user?.name || 'User'}</div>
                  <div className={styles.dropdownUsername}>{user?.username}</div>
                  <div className={styles.dropdownRole}>
                    {user?.role === 'admin' ? t('admin') : t('employee')}
                  </div>
                </div>
              </div>

              <div className={styles.dropdownDivider}></div>

              <button
                type="button"
                className={styles.dropdownItem}
                onClick={handleProfileClick}
              >
                {"\u{1F464}"} <span>{t('myProfile')}</span>
              </button>

              <div className={styles.dropdownDivider}></div>

              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.logoutButton}`}
                onClick={handleLogout}
              >
                {"\u{1F6AA}"} <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default RedesignHeader;
