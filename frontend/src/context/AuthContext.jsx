import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/auth.api";
import { employeeAPI } from "../api/employee.api";
import { settingsAPI } from "../api/settings.api";

const AuthContext = createContext(null);

const USER_STORAGE_FIELDS = [
  "token",
  "refreshToken",
  "role",
  "username",
  "employeeId",
  "name",
  "avatar",
  "email",
  "phone",
  "designation",
];

const readStoredUser = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  return {
    token,
    refreshToken: localStorage.getItem("refreshToken"),
    role: localStorage.getItem("role"),
    username: localStorage.getItem("username"),
    employeeId: localStorage.getItem("employeeId"),
    name: localStorage.getItem("name"),
    avatar: localStorage.getItem("avatar"),
    email: localStorage.getItem("email"),
    phone: localStorage.getItem("phone"),
    designation: localStorage.getItem("designation"),
  };
};

const persistUser = (user) => {
  USER_STORAGE_FIELDS.forEach((field) => {
    const value = user?.[field];
    if (value === undefined || value === null || value === "") {
      localStorage.removeItem(field);
    } else {
      localStorage.setItem(field, value);
    }
  });
};

const enrichEmployeeUser = async (user) => {
  if (!user?.employeeId || user.role !== "employee") {
    return user;
  }

  try {
    const res = await employeeAPI.getOne(user.employeeId);
    const employee = res.data.employee;

    const enrichedUser = {
      ...user,
      name: employee?.name || user.name || user.username,
      avatar: employee?.photo || user.avatar || null,
      email: employee?.email || user.email || null,
      phone: employee?.phone || user.phone || null,
      designation: employee?.designation || user.designation || null,
    };

    persistUser(enrichedUser);
    return enrichedUser;
  } catch {
    return {
      ...user,
      name: user.name || user.username,
    };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const storedUser = readStoredUser();
        if (storedUser && active) {
          const hydratedUser = await enrichEmployeeUser(storedUser);
          if (active) setUser(hydratedUser);
        }

        const res = await settingsAPI.get();
        const companyData = res.data.settings || res.data;
        if (active) setCompany(companyData);
      } catch {
        if (active) setCompany(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    init();

    return () => {
      active = false;
    };
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login({ username, password });
    const { token, refreshToken, role, employeeId, username: storedUsername } = res.data;

    const baseUser = {
      token,
      refreshToken,
      role,
      username: storedUsername || username,
      employeeId: employeeId || "",
      name: storedUsername || username,
      avatar: null,
      email: null,
      phone: null,
      designation: null,
    };

    persistUser(baseUser);

    const nextUser = role === "employee"
      ? await enrichEmployeeUser(baseUser)
      : baseUser;

    setUser(nextUser);
    return role;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (_) {
      // Ignore logout API failure and still clear local state.
    }

    localStorage.clear();
    setUser(null);
  };

  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    persistUser(updatedUser);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      company,
      setCompany,
      login,
      logout,
      updateProfile,
      loading,
      isAdmin: user?.role === "admin",
      isEmployee: user?.role === "employee",
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
