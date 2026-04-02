import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import RedesignSidebar from "./components/redesign/Sidebar";
import RedesignHeader from "./components/redesign/Header";
import RedesignBottomTabBar from "./components/redesign/BottomTabBar";
import PrivateRoute from "./components/common/PrivateRoute";
import Loader from "./components/common/Loader";
import "./redesign.css";

import Login from "./pages/Auth/Login";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import AnalyticsDashboard from "./pages/Analytics/AnalyticsDashboard";
import EmployeeList from "./pages/Employees/EmployeeList";
import Attendance from "./pages/Attendance/Attendance";
import GeoAttendance from "./pages/Attendance/GeoAttendance";
import Salary from "./pages/Salary/Salary";
import Reports from "./pages/Reports/Reports";
import Projects from "./pages/Projects/Projects";
import Leaves from "./pages/Leaves/Leaves";
import DPRPage from "./pages/DPR/DPRPage";
import InventoryPage from "./pages/Inventory/InventoryPage";
import ExpensesPage from "./pages/Expenses/ExpensesPage";
import TasksPage from "./pages/Tasks/TasksPage";
import Profile from "./pages/Profile/Profile";
import AdminProfile from "./pages/Profile/AdminProfile";
import EmployeeProfile from "./pages/Profile/EmployeeProfile";
import CompanySettingsPage from "./pages/CompanySettings/CompanySettingsPage";
import AdvancePage from "./pages/Advance/AdvancePage";
import QuotationPage from "./pages/Quotation/QuotationPage";
import SubcontractorPage from "./pages/Subcontractor/SubcontractorPage";
import EquipmentPage from "./pages/Equipment/EquipmentPage";
import { MyDashboard, MyAttendance, MySalary } from "./pages/EmployeePortal/EmployeePortal";
import MyLeaves from "./pages/EmployeePortal/MyLeaves";

const DESKTOP_BREAKPOINT = 1024;
const TABLET_BREAKPOINT = 768;

const getViewportType = () => {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < TABLET_BREAKPOINT) return "mobile";
  if (window.innerWidth < DESKTOP_BREAKPOINT) return "tablet";
  return "desktop";
};

const RedesignLayout = ({ children }) => {
  const location = useLocation();
  const [viewportType, setViewportType] = useState(getViewportType);
  const [sidebarOpen, setSidebarOpen] = useState(() => getViewportType() === "desktop");

  useEffect(() => {
    const handleResize = () => setViewportType(getViewportType());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Desktop pe sidebar hamesha open rahe
  useEffect(() => {
    setSidebarOpen(viewportType === "desktop");
  }, [viewportType]);

  // Mobile/Tablet pe page change hone pe sidebar band ho jaye
  useEffect(() => {
    if (viewportType !== "desktop") setSidebarOpen(false);
  }, [location.pathname, viewportType]);

  const handleMenuToggle = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className={`redesign-app ${sidebarOpen ? "sidebar-open" : "sidebar-closed"} viewport-${viewportType}`}>
      {/* Header */}
      <RedesignHeader onMenuToggle={handleMenuToggle} />

      {/* Sidebar */}
      <RedesignSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        shouldCloseOnNavigate={viewportType !== "desktop"}
      />

      {/* Main Content - Yeh important hai */}
      <main className="main-content">
        {children}
      </main>

      {/* Bottom Tab Bar (Mobile ke liye) */}
      <RedesignBottomTabBar />
    </div>
  );
};

const AdminWrapper = ({ children }) => (
  <PrivateRoute requiredRole="admin">
    <RedesignLayout>{children}</RedesignLayout>
  </PrivateRoute>
);

const EmployeeWrapper = ({ children }) => (
  <PrivateRoute requiredRole="employee">
    <RedesignLayout>{children}</RedesignLayout>
  </PrivateRoute>
);

// Redirect wrapper
const RedirectIfAuthenticated = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === "admin" ? "/" : "/my-dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <Loader />;
  if (user) return null;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && window.location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <Loader />;

  return (
    <Routes>
      {/* Login route */}
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        }
      />

      {/* Admin routes */}
      <Route path="/" element={<AdminWrapper><AdminDashboard /></AdminWrapper>} />
      <Route path="/analytics" element={<AdminWrapper><AnalyticsDashboard /></AdminWrapper>} />
      <Route path="/projects" element={<AdminWrapper><Projects /></AdminWrapper>} />
      <Route path="/employees" element={<AdminWrapper><EmployeeList /></AdminWrapper>} />
      <Route path="/attendance" element={<AdminWrapper><Attendance /></AdminWrapper>} />
      <Route path="/leaves" element={<AdminWrapper><Leaves /></AdminWrapper>} />
      <Route path="/advances" element={<AdminWrapper><AdvancePage /></AdminWrapper>} />
      <Route path="/dpr" element={<AdminWrapper><DPRPage /></AdminWrapper>} />
      <Route path="/inventory" element={<AdminWrapper><InventoryPage /></AdminWrapper>} />
      <Route path="/expenses" element={<AdminWrapper><ExpensesPage /></AdminWrapper>} />
      <Route path="/tasks" element={<AdminWrapper><TasksPage /></AdminWrapper>} />
      <Route path="/subcontractors" element={<AdminWrapper><SubcontractorPage /></AdminWrapper>} />
      <Route path="/equipment" element={<AdminWrapper><EquipmentPage /></AdminWrapper>} />
      <Route path="/quotations" element={<AdminWrapper><QuotationPage /></AdminWrapper>} />
      <Route path="/salary" element={<AdminWrapper><Salary /></AdminWrapper>} />
      <Route path="/reports" element={<AdminWrapper><Reports /></AdminWrapper>} />
      <Route path="/settings" element={<AdminWrapper><CompanySettingsPage /></AdminWrapper>} />
      <Route path="/profile" element={<AdminWrapper><Profile /></AdminWrapper>} />

      {/* Employee routes */}
      <Route path="/my-dashboard" element={<EmployeeWrapper><MyDashboard /></EmployeeWrapper>} />
      <Route path="/my-attendance-mark" element={<EmployeeWrapper><GeoAttendance /></EmployeeWrapper>} />
      <Route path="/my-attendance" element={<EmployeeWrapper><MyAttendance /></EmployeeWrapper>} />
      <Route path="/my-salary" element={<EmployeeWrapper><MySalary /></EmployeeWrapper>} />
      <Route path="/my-leaves" element={<EmployeeWrapper><MyLeaves /></EmployeeWrapper>} />
      <Route path="/my-tasks" element={<EmployeeWrapper><TasksPage /></EmployeeWrapper>} />
      <Route path="/my-expenses" element={<EmployeeWrapper><ExpensesPage /></EmployeeWrapper>} />
      <Route path="/my-dpr" element={<EmployeeWrapper><DPRPage /></EmployeeWrapper>} />
      <Route path="/my-advances" element={<EmployeeWrapper><AdvancePage /></EmployeeWrapper>} />
      <Route path="/my-profile" element={<EmployeeWrapper><EmployeeProfile /></EmployeeWrapper>} />
    </Routes>
  );
};

const App = () => <AppRoutes />;
export default App;