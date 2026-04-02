import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../redesign/Header';
import Sidebar from '../redesign/Sidebar';
import BottomTabBar from '../redesign/BottomTabBar';

const DESKTOP_BREAKPOINT = 1024;
const TABLET_BREAKPOINT = 768;

const getViewportType = () => {
  if (typeof window === 'undefined') return 'desktop';
  if (window.innerWidth < TABLET_BREAKPOINT) return 'mobile';
  if (window.innerWidth < DESKTOP_BREAKPOINT) return 'tablet';
  return 'desktop';
};

const Layout = ({ children }) => {
  const location = useLocation();
  const [viewportType, setViewportType] = useState(getViewportType);
  const [sidebarOpen, setSidebarOpen] = useState(() => getViewportType() === 'desktop');

  useEffect(() => {
    const handleResize = () => {
      setViewportType(getViewportType());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(viewportType === 'desktop');
  }, [viewportType]);

  useEffect(() => {
    if (viewportType !== 'desktop') {
      setSidebarOpen(false);
    }
  }, [location.pathname, viewportType]);

  const handleMenuToggle = () => {
    if (viewportType === 'mobile') return;
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className={`redesign-app ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} viewport-${viewportType}`}>
      <Header />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={handleMenuToggle}
        shouldCloseOnNavigate={viewportType !== 'desktop'}
        showToggle={viewportType !== 'mobile'}
      />
      <main className="main-content">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
};

export default Layout;
