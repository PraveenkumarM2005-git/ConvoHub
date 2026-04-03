// ============================================================
// Auth Store (Zustand)
// Manages authentication state: user, login, register, logout
// ============================================================

import { create } from "zustand";
import api from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: true, // True while checking auth on app load
  error: null,

  // ─── Check if user is already authenticated ────────────────
  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get("/auth/me");
      if (res.data.success) {
        set({
          user: res.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        connectSocket();
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // ─── Register ──────────────────────────────────────────────
  register: async (name, email, password) => {
    try {
      set({ error: null });
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      if (res.data.success) {
        set({
          user: res.data.user,
          isAuthenticated: true,
        });
        connectSocket();
        return { success: true };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Registration failed.";
      set({ error: message });
      return { success: false, message };
    }
  },

  // ─── Login ─────────────────────────────────────────────────
  login: async (email, password) => {
    try {
      set({ error: null });
      const res = await api.post("/auth/login", { email, password });

      if (res.data.success) {
        set({
          user: res.data.user,
          isAuthenticated: true,
        });
        connectSocket();
        return { success: true };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Login failed.";
      set({ error: message });
      return { success: false, message };
    }
  },

  // ─── Logout ────────────────────────────────────────────────
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      disconnectSocket();
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  // ─── Update user profile locally ──────────────────────────
  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData },
    }));
  },

  // ─── Clear error ──────────────────────────────────────────
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
