import axios from "axios";

const api = axios.create({ baseURL: "/api", headers: { "Content-Type": "application/json" } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failQueue = [];

const processQueue = (error, token = null) => {
  failQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failQueue = [];
};

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failQueue.push({ resolve, reject });
        }).then(token => { original.headers.Authorization = `Bearer ${token}`; return api(original); });
      }
      original._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) { localStorage.clear(); window.location.href = "/login"; return Promise.reject(error); }
      try {
        const res = await axios.post("/api/auth/refresh", { refreshToken });
        const newToken = res.data.data.token;
        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", res.data.data.refreshToken);
        api.defaults.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(original);
      } catch (e) {
        processQueue(e, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(e);
      } finally { isRefreshing = false; }
    }
    return Promise.reject(error.response?.data || { message: "Network error" });
  }
);

export default api;
