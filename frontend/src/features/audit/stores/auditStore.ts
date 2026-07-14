"use client";

import { create } from "zustand";
import type { AuditLogEntry } from "@/lib/audit";
import * as auditApi from "@/lib/audit";

interface AuditState {
  logs: AuditLogEntry[];
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number } | null;
  isLoading: boolean;
  filter: { action?: string; entityType?: string };

  fetchLogs: (workspaceId: string, page?: number) => Promise<void>;
  setFilter: (filter: { action?: string; entityType?: string }) => void;
  clearFilter: () => void;
}

export const useAuditStore = create<AuditState>((set, get) => ({
  logs: [],
  pagination: null,
  isLoading: false,
  filter: {},

  fetchLogs: async (workspaceId, page = 1) => {
    set({ isLoading: true });
    try {
      const { filter } = get();
      const response = await auditApi.getAuditLogs({
        workspaceId,
        action: filter.action,
        entityType: filter.entityType,
        page,
        pageSize: 20,
      });
      set({ logs: response.data, pagination: response.pagination, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setFilter: (filter) => set({ filter }),
  clearFilter: () => set({ filter: {} }),
}));
