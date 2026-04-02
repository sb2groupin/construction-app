import api from "./axios.config";

export const attendanceAPI = {
  getAll:        (params) => api.get("/attendance", { params }),
  todaySummary:  (params) => api.get("/attendance/today-summary", { params }),
  mark:          (data)   => api.post("/attendance", data),
  update:        (id, data) => api.put(`/attendance/${id}`, data),
};
