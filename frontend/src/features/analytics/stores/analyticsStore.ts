"use client";

import { create } from "zustand";
import type {
  WorkspaceOverview,
  WorkspaceGrowth,
  TopMember,
  TaskStatus,
  TimelinePoint,
} from "@/lib/analytics";
import * as analyticsApi from "@/lib/analytics";

interface AnalyticsState {
  overview: WorkspaceOverview | null;
  growth: WorkspaceGrowth[];
  topMembers: TopMember[];
  taskStatus: TaskStatus[];
  documentTimeline: TimelinePoint[];
  messageTimeline: TimelinePoint[];
  isLoading: boolean;

  fetchAll: (workspaceId: string) => Promise<void>;
  fetchOverview: (workspaceId: string) => Promise<void>;
  fetchGrowth: (workspaceId: string) => Promise<void>;
  fetchTopMembers: (workspaceId: string) => Promise<void>;
  fetchTaskStatus: (workspaceId: string) => Promise<void>;
  fetchDocumentTimeline: (workspaceId: string) => Promise<void>;
  fetchMessageTimeline: (workspaceId: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  overview: null,
  growth: [],
  topMembers: [],
  taskStatus: [],
  documentTimeline: [],
  messageTimeline: [],
  isLoading: false,

  fetchAll: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const [overview, growth, topMembers, taskStatus, documentTimeline, messageTimeline] =
        await Promise.all([
          analyticsApi.getWorkspaceOverview(workspaceId),
          analyticsApi.getWorkspaceGrowth(workspaceId),
          analyticsApi.getTopMembers(workspaceId),
          analyticsApi.getTaskStatus(workspaceId),
          analyticsApi.getDocumentTimeline(workspaceId),
          analyticsApi.getMessageTimeline(workspaceId),
        ]);
      set({ overview, growth, topMembers, taskStatus, documentTimeline, messageTimeline, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchOverview: async (workspaceId) => {
    const overview = await analyticsApi.getWorkspaceOverview(workspaceId);
    set({ overview });
  },
  fetchGrowth: async (workspaceId) => {
    const growth = await analyticsApi.getWorkspaceGrowth(workspaceId);
    set({ growth });
  },
  fetchTopMembers: async (workspaceId) => {
    const topMembers = await analyticsApi.getTopMembers(workspaceId);
    set({ topMembers });
  },
  fetchTaskStatus: async (workspaceId) => {
    const taskStatus = await analyticsApi.getTaskStatus(workspaceId);
    set({ taskStatus });
  },
  fetchDocumentTimeline: async (workspaceId) => {
    const documentTimeline = await analyticsApi.getDocumentTimeline(workspaceId);
    set({ documentTimeline });
  },
  fetchMessageTimeline: async (workspaceId) => {
    const messageTimeline = await analyticsApi.getMessageTimeline(workspaceId);
    set({ messageTimeline });
  },
}));
