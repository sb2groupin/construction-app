import api from "./axios.config";

export const projectAPI = {
  getAll:        (params)     => api.get("/projects", { params }),
  getSummary:    ()           => api.get("/projects/summary"),
  getOne:        (id)         => api.get(`/projects/${id}`),
  add:           (data)       => api.post("/projects", data),
  update:        (id, data)   => api.put(`/projects/${id}`, data),
  remove:        (id)         => api.delete(`/projects/${id}`),
  assignEmployee:(id, data)   => api.post(`/projects/${id}/assign`, data),
};
