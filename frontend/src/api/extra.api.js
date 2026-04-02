import api from "./axios.config";

export const dprAPI = {
  getAll:     (params) => api.get("/dpr", { params }),
  submit:     (data)   => api.post("/dpr", data, { headers: { "Content-Type": "multipart/form-data" } }),
  addComment: (id, data) => api.patch(`/dpr/${id}/comment`, data),
};

export const inventoryAPI = {
  getAll:         (params) => api.get("/inventory", { params }),
  add:            (data)   => api.post("/inventory", data),
  receive:        (data)   => api.post("/inventory/receive", data, { headers: { "Content-Type": "multipart/form-data" } }),
  use:            (data)   => api.post("/inventory/use", data),
  getTransactions:(params) => api.get("/inventory/transactions", { params }),
  getRequests:    (params) => api.get("/inventory/requests", { params }),
  createRequest:  (data)   => api.post("/inventory/requests", data),
  reviewRequest:  (id, data) => api.patch(`/inventory/requests/${id}`, data),
};

export const expenseAPI = {
  getAll:       (params) => api.get("/expenses", { params }),
  submit:       (data)   => api.post("/expenses", data, { headers: { "Content-Type": "multipart/form-data" } }),
  review:       (id, data) => api.patch(`/expenses/${id}/review`, data),
  getPettyCash: (params) => api.get("/expenses/petty-cash", { params }),
  addPettyCash: (data)   => api.post("/expenses/petty-cash", data),
};

export const taskAPI = {
  getAll:    (params)   => api.get("/tasks", { params }),
  getOverdue:()         => api.get("/tasks/overdue"),
  create:    (data)     => api.post("/tasks", data),
  update:    (id, data) => api.put(`/tasks/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  remove:    (id)       => api.delete(`/tasks/${id}`),
};

export const noticeAPI = {
  getNotices:     ()         => api.get("/notices"),
  createNotice:   (data)     => api.post("/notices", data),
  deleteNotice:   (id)       => api.delete(`/notices/${id}`),
  getIncidents:   (params)   => api.get("/incidents", { params }),
  reportIncident: (data)     => api.post("/incidents", data, { headers: { "Content-Type": "multipart/form-data" } }),
  updateIncident: (id, data) => api.patch(`/incidents/${id}`, data),
};

export const notificationAPI = {
  getAll:      ()    => api.get("/notifications"),
  getUnread:   ()    => api.get("/notifications/unread-count"),
  markRead:    (id)  => api.patch(`/notifications/${id}/read`),
  markAllRead: ()    => api.post("/notifications/mark-all-read"),
  clear:       ()    => api.delete("/notifications/clear"),
};

export const subcontractorAPI = {
  getAll:     (params)    => api.get("/subcontractors", { params }),
  create:     (data)      => api.post("/subcontractors", data),
  update:     (id, data)  => api.put(`/subcontractors/${id}`, data),
  remove:     (id)        => api.delete(`/subcontractors/${id}`),
  addPayment: (id, data)  => api.post(`/subcontractors/${id}/payment`, data),
};

export const equipmentAPI = {
  getAll:       (params)   => api.get("/equipment", { params }),
  create:       (data)     => api.post("/equipment", data),
  update:       (id, data) => api.put(`/equipment/${id}`, data),
  remove:       (id)       => api.delete(`/equipment/${id}`),
  addUsage:     (id, data) => api.post(`/equipment/${id}/usage`, data),
  markService:  (id, data) => api.post(`/equipment/${id}/service`, data),
};
