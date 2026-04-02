import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const BottomTabBar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const isEmployee = user?.role === 'employee';

  // Bottom tabs according to user role
  const mainTabs = isEmployee
    ? [
        { 
          label: t('myDashboard') || 'Dashboard', 
          path: '/my-dashboard', 
          icon: '📊' 
        },
        { 
          label: t('myAttendance') || 'Attendance', 
          path: '/my-attendance', 
          icon: '📋' 
        },
        { 
          label: t('mySalary') || 'Salary', 
          path: '/my-salary', 
          icon: '💰' 
        },
        { 
          label: t('tasks') || 'Tasks', 
          path: '/my-tasks', 
          icon: '✅' 
        },
      ]
    : [
        { 
          label: t('dashboardAdmin') || 'Dashboard', 
          path: '/', 
          icon: '📊' 
        },
        { 
          label: t('projects') || 'Projects', 
          path: '/projects', 
          icon: '🏗️' 
        },
        { 
          label: t('tasks') || 'Tasks', 
          path: '/tasks', 
          icon: '✅' 
        },
        { 
          label: t('employees') || 'Staff', 
          path: '/employees', 
          icon: '👥' 
        },
      ];

  return (
    <nav className="bottom-tab-bar">
      {mainTabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
          end   // Important for root path '/'
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomTabBar;