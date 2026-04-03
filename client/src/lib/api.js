// ============================================================
// Axios API Instance
// Base configuration for all HTTP requests to the backend
// ============================================================

import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // Send HTTP-only cookies with every request
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor — handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — redirect to login
      // Only redirect if not already on auth pages
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/register")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
