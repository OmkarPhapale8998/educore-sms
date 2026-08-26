// ============================================================
// client.js
// Creates ONE shared axios instance used by every API call.
// It attaches the saved login token to each request and, when
// a request fails with 401 (session expired), clears the
// session and sends the user back to /login.
// ============================================================
import axios from "axios";

// Central axios instance: base URL comes from .env, cookies are sent along.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach token from localStorage if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 unauthorized
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== "/login" && !window.location.pathname.startsWith("/reset-password")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Server address WITHOUT the "/api" ending - used to build direct
// links to uploaded files (documents, notice attachments, etc).
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export default API;

