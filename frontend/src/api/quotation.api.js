import api from "./axios.config";
export const quotationAPI = {
  getAll:       (params)    => api.get("/quotations", { params }),
  create:       (data)      => api.post("/quotations", data),
  update:       (id, data)  => api.put(`/quotations/${id}`, data),
  remove:       (id)        => api.delete(`/quotations/${id}`),
  toAgreement:  (id, data)  => api.post(`/quotations/${id}/to-agreement`, data),
  getAllAgreements: ()       => api.get("/agreements"),
  updateAgreement: (id, data) => api.put(`/agreements/${id}`, data),
  signAgreement:   (id, data) => api.patch(`/agreements/${id}/sign`, data),
};
