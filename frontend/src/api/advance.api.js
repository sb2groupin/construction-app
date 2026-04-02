import api from "./axios.config";
export const advanceAPI = {
  getAll:   (params)    => api.get("/advances", { params }),
  getSummary:(empId)    => api.get(`/advances/summary/${empId}`),
  request:  (data)      => api.post("/advances", data),
  approve:  (id, data)  => api.patch(`/advances/${id}/approve`, data),
  reject:   (id, data)  => api.patch(`/advances/${id}/reject`, data),
};
