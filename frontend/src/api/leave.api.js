import api from "./axios.config";

export const leaveAPI = {
  getAll:         (params)    => api.get("/leaves", { params }),
  getPendingCount:()          => api.get("/leaves/pending-count"),
  apply:          (data)      => api.post("/leaves", data),
  approve:        (id, data)  => api.patch(`/leaves/${id}/approve`, data),
  reject:         (id, data)  => api.patch(`/leaves/${id}/reject`, data),
  cancel:         (id)        => api.delete(`/leaves/${id}`),
};
