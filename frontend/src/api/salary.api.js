import api from "./axios.config";

export const salaryAPI = {
  getMonthly:      (id, params) => api.get(`/salary/month/${id}`, { params }),
  getRange:        (id, params) => api.get(`/salary/range/${id}`, { params }),
  getMonthlyReport:(params)     => api.get("/salary/monthly-report", { params }),
};
