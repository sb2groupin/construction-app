import api from "./axios.config";

export const attendanceAPI = {
  // Existing / basic
  getAll: (params) => api.get("/attendance", { params }),
  todaySummary: (params) => api.get("/attendance/today-summary", { params }),
  update: (id, data) => api.put(`/attendance/${id}`, data),

  // New endpoints for geofencing + offline support
  checkin: (data, selfieFile = null) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    if (selfieFile) formData.append("selfie", selfieFile);
    return api.post("/attendance/checkin", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },

  checkout: (data) => api.post("/attendance/checkout", data),

  updateLocation: (data) => api.post("/attendance/location", data),

  getMyAttendance: (params) => api.get("/attendance/my", { params }), // employee's own

  getFlagged: (params) => api.get("/attendance/flagged", { params }), // admin only

  getActive: () => api.get("/attendance/active"), // currently checked-in

  syncOffline: (records) => api.post("/attendance/sync", { records }),

  // Legacy mark (if still used)
  mark: (data) => api.post("/attendance", data),
};