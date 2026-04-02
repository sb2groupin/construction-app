import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const getAdminNavigation = (t) => ({
  main: [
    { label: t('dashboardAdmin'), path: '/', icon: '📊' },
  ],
  projects: [
    { label: t('projects'), path: '/projects', icon: '🏗️' },
    { label: t('tasks'), path: '/tasks', icon: '✅' },
    { label: t('dpr'), path: '/dpr', icon: '📝' },
    { label: t('equipment'), path: '/equipment', icon: '🔧' },
  ],
  hr: [
    { label: t('employees'), path: '/employees', icon: '👥' },
    { label: t('attendance'), path: '/attendance', icon: '📋' },
    { label: t('salary'), path: '/salary', icon: '💰' },
  ],
  operations: [
    { label: t('inventory'), path: '/inventory', icon: '📦' },
    { label: t('expenses'), path: '/expenses', icon: '💸' },
  ],
  admin: [
    { label: t('reports'), path: '/reports', icon: '📈' },
    { label: t('settings'), path: '/settings', icon: '⚙️' },
  ],
});

const getEmployeeNavigation = (t) => ({
  main: [
    { label: t('myDashboard') || 'My Dashboard', path: '/my-dashboard', icon: '📊' },
  ],
  attendance: [
    { label: t('myAttendance') || 'My Attendance', path: '/my-attendance', icon: '📋' },
    { label: t('markAttendance') || 'Mark Attendance', path: '/my-attendance-mark', icon: '📍' },
    { label: t('myLeaves') || 'My Leaves', path: '/my-leaves', icon: '🏖️' },
  ],
  work: [
    { label: t('tasks') || 'Tasks', path: '/my-tasks', icon: '✅' },
    { label: t('dpr') || 'DPR', path: '/my-dpr', icon: '📝' },
    { label: t('expenses') || 'Expenses', path: '/my-expenses', icon: '💸' },
  ],
  account: [
    { label: t('mySalary') || 'My Salary', path: '/my-salary', icon: '💰' },
    { label: t('advanceRequest') || 'My Advances', path: '/my-advances', icon: '💳' },
    { label: t('myProfile') || 'My Profile', path: '/my-profile', icon: '👤' },
  ],
});

const getCategoryLabels = (t, isEmployee) => (
  isEmployee
    ? {
        attendance: `⏱️ ${t('attendance') || 'Attendance'}`,
        work: `🛠️ ${t('projectsAndWork') || 'Work'}`,
        account: `👤 ${t('myProfile') || 'Account'}`,
      }
    : {
        projects: `🏢 ${t('projectsAndWork')}`,
        hr: `👔 ${t('humanResources')}`,
        operations: `⚙️ ${t('operations')}`,
        admin: `⚡ ${t('admin')}`,
      }
);

const Sidebar = ({
  open,
  onClose,
  shouldCloseOnNavigate = true,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const navigation = isEmployee ? getEmployeeNavigation(t) : getAdminNavigation(t);
  const categoryLabels = getCategoryLabels(t, isEmployee);

  const initialExpandedState = Object.keys(navigation).reduce((acc, key) => {
    if (key !== 'main') acc[key] = true;
    return acc;
  }, {});

  const [expandedCategories, setExpandedCategories] = useState(initialExpandedState);

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleNavClick = () => {
    if (shouldCloseOnNavigate) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile/tablet */}
      {open && shouldCloseOnNavigate && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
        <nav className="sidebar-nav">
          {/* Main Dashboard Link */}
          {navigation.main.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              onClick={handleNavClick}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Categorized Navigation */}
          {Object.entries(navigation)
            .filter(([key]) => key !== 'main')
            .map(([category, items]) => (
              <div key={category} className="nav-category">
                <button
                  type="button"
                  className="nav-category-header"
                  onClick={() => toggleCategory(category)}
                >
                  <span>{categoryLabels[category]}</span>
                  <span className={`chevron ${expandedCategories[category] ? 'open' : ''}`}>›</span>
                </button>

                {expandedCategories[category] && (
                  <div className="nav-category-items">
                    {items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'nav-link-active' : ''}`}
                        onClick={handleNavClick}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;