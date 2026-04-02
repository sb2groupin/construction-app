import api from "./axios.config";
export const settingsAPI = {
  get:    ()     => api.get("/settings"),
  update: (data) => api.put("/settings", data),
};
