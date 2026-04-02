import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "./Loader";

// requiredRole: "admin" | "employee" | null (any logged in user)
const PrivateRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user)   return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    // Employee admin pages pe na jaaye
    return <Navigate to={user.role === "admin" ? "/" : "/my-dashboard"} replace />;
  }

  return children;
};

export default PrivateRoute;
