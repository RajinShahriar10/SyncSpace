"use client";

import { create } from "zustand";
import type { User, Theme } from "@/types";
import * as authLib from "@/lib/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: authLib.RegisterRequest) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password, rememberMe = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authLib.login({ email, password, rememberMe });
      if (response.success) {
        authLib.storeTokens(response.data.accessToken, response.data.refreshToken);
        set({
          user: response.data.user as User,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ error: response.message || "Login failed", isLoading: false });
        throw new Error(response.message || "Login failed");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authLib.register(data);
      if (response.success) {
        authLib.storeTokens(response.data.accessToken, response.data.refreshToken);
        set({
          user: response.data.user as User,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ error: response.message || "Registration failed", isLoading: false });
        throw new Error(response.message || "Registration failed");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  googleLogin: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authLib.googleLogin({ idToken });
      if (response.success) {
        authLib.storeTokens(response.data.accessToken, response.data.refreshToken);
        set({
          user: response.data.user as User,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ error: response.message || "Google login failed", isLoading: false });
        throw new Error(response.message || "Google login failed");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  logout: async () => {
    const refreshToken = authLib.getStoredRefreshToken();
    if (refreshToken) {
      try {
        await authLib.revokeToken(refreshToken);
      } catch {
        // Token revocation failed, still log out locally
      }
    }
    authLib.clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  initializeAuth: async () => {
    const accessToken = authLib.getStoredAccessToken();
    if (!accessToken) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await authLib.getCurrentUser();
      set({ user: user as User, isAuthenticated: true, isLoading: false });
    } catch {
      authLib.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  theme: "dark",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setTheme: (theme) => set({ theme }),
}));

interface WorkspaceSelectionState {
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;
}

export const useWorkspaceSelectionStore = create<WorkspaceSelectionState>((set) => ({
  currentWorkspaceId: null,
  setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
}));
