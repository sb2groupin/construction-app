import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const buildApiUrl = (path) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failQueue = [];
// Guard to prevent multiple simultaneous logout redirects
let isRedirectingToLogin = false;

const processQueue = (error, token = null) => {
  failQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failQueue = [];
};

const redirectToLogin = () => {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  localStorage.clear();
  // Use React Router history if available, otherwise fallback to location.replace
  // location.replace avoids adding to browser history (no back-button loop)
  window.location.replace("/login");
};

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const original = error.config;

    // Skip refresh logic for auth endpoints to avoid loops
    const isAuthEndpoint = original?.url?.includes("/auth/login") ||
                           original?.url?.includes("/auth/refresh") ||
                           original?.url?.includes("/auth/logout");

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }).catch(err => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(buildApiUrl("/auth/refresh"), { refreshToken });
        const newToken = res.data.data.token;
        const newRefreshToken = res.data.data.refreshToken;
        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        api.defaults.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        redirectToLogin();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || { message: "Network error" });
  }
);

export default api;
