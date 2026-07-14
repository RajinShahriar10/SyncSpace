"use client";

import { create } from "zustand";
import * as adminApi from "@/lib/admin";
import type { AdminOverview, AdminUser, AdminWorkspace, AdminDocument, StorageOverview, SystemHealth, AdminAuditLog } from "@/lib/admin";

interface AdminState {
  overview: AdminOverview | null;
  users: AdminUser[];
  usersPagination: { page: number; totalCount: number; totalPages: number } | null;
  workspaces: AdminWorkspace[];
  workspacesPagination: { page: number; totalCount: number; totalPages: number } | null;
  documents: AdminDocument[];
  documentsPagination: { page: number; totalCount: number; totalPages: number } | null;
  storage: StorageOverview | null;
  health: SystemHealth | null;
  auditLogs: AdminAuditLog[];
  auditPagination: { page: number; totalCount: number; totalPages: number } | null;
  isLoading: boolean;

  fetchOverview: () => Promise<void>;
  fetchUsers: (search?: string, page?: number) => Promise<void>;
  updateUser: (req: Parameters<typeof adminApi.updateUser>[0]) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  fetchWorkspaces: (search?: string, page?: number) => Promise<void>;
  updateWorkspace: (req: Parameters<typeof adminApi.updateWorkspace>[0]) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  fetchDocuments: (search?: string, page?: number) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  fetchStorage: () => Promise<void>;
  fetchHealth: () => Promise<void>;
  fetchAuditLogs: (params?: { action?: string; userId?: string; page?: number }) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  overview: null, users: [], usersPagination: null,
  workspaces: [], workspacesPagination: null,
  documents: [], documentsPagination: null,
  storage: null, health: null,
  auditLogs: [], auditPagination: null,
  isLoading: false,

  fetchOverview: async () => { set({ isLoading: true }); try { const d = await adminApi.getOverview(); set({ overview: d, isLoading: false }); } catch { set({ isLoading: false }); } },
  fetchUsers: async (search, page = 1) => { set({ isLoading: true }); try { const d = await adminApi.getUsers(search, page); set({ users: d.data, usersPagination: d.pagination, isLoading: false }); } catch { set({ isLoading: false }); } },
  updateUser: async (req) => { await adminApi.updateUser(req); },
  deleteUser: async (id) => { await adminApi.deleteUser(id); },
  fetchWorkspaces: async (search, page = 1) => { set({ isLoading: true }); try { const d = await adminApi.getWorkspaces(search, page); set({ workspaces: d.data, workspacesPagination: d.pagination, isLoading: false }); } catch { set({ isLoading: false }); } },
  updateWorkspace: async (req) => { await adminApi.updateWorkspace(req); },
  deleteWorkspace: async (id) => { await adminApi.deleteWorkspace(id); },
  fetchDocuments: async (search, page = 1) => { set({ isLoading: true }); try { const d = await adminApi.getDocuments(search, page); set({ documents: d.data, documentsPagination: d.pagination, isLoading: false }); } catch { set({ isLoading: false }); } },
  deleteDocument: async (id) => { await adminApi.deleteDocument(id); },
  fetchStorage: async () => { set({ isLoading: true }); try { const d = await adminApi.getStorage(); set({ storage: d, isLoading: false }); } catch { set({ isLoading: false }); } },
  fetchHealth: async () => { set({ isLoading: true }); try { const d = await adminApi.getSystemHealth(); set({ health: d, isLoading: false }); } catch { set({ isLoading: false }); } },
  fetchAuditLogs: async (params) => { set({ isLoading: true }); try { const d = await adminApi.getAuditLogs(params || {}); set({ auditLogs: d.data, auditPagination: d.pagination, isLoading: false }); } catch { set({ isLoading: false }); } },
}));
