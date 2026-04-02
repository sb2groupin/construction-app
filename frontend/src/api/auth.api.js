import api from "./axios.config";
export const authAPI = {
  login:               (data)     => api.post("/auth/login", data),
  refresh:             (data)     => api.post("/auth/refresh", data),
  logout:              ()         => api.post("/auth/logout"),
  createEmployeeLogin: (data)     => api.post("/auth/create-employee-login", data),
  changePassword:      (data)     => api.put("/auth/change-password", data),
  resetPassword:       (data)     => api.put("/auth/reset-password", data),
  forceLogout:         (userId)   => api.post(`/auth/force-logout/${userId}`),
  getSessions:         ()         => api.get("/auth/sessions"),
};
