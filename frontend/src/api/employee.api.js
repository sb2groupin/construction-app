import api from "./axios.config";

export const employeeAPI = {
  getAll:    (params)     => api.get("/employees", { params }),
  getOne:    (id)         => api.get(`/employees/${id}`),
  add:       (data)       => api.post("/employees", data),
  update:    (id, data)   => api.put(`/employees/${id}`, data),
  remove:    (id)         => api.delete(`/employees/${id}`),
};
