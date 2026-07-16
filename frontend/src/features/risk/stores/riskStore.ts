"use client";

import { create } from "zustand";
import * as riskApi from "@/lib/risk";

interface RiskState {
  dashboard: riskApi.RiskDashboard | null;
  assessments: riskApi.RiskAssessment[];
  alerts: riskApi.RiskAlert[];
  groupDetail: riskApi.GroupRiskDetail | null;
  filterRiskLevel: string | null;
  filterCourseId: string | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: string | null;

  fetchDashboard: (courseId?: string) => Promise<void>;
  fetchAssessments: (courseId?: string, riskLevel?: string) => Promise<void>;
  fetchAlerts: (courseId?: string, severity?: string, acknowledged?: boolean) => Promise<void>;
  fetchGroupDetail: (groupId: string) => Promise<void>;
  runAssessment: (groupId: string) => Promise<void>;
  acknowledgeAlert: (alertId: string, userId: string) => Promise<void>;
  setFilterRiskLevel: (level: string | null) => void;
  setFilterCourseId: (courseId: string | null) => void;
  autoRefresh: () => Promise<void>;
}

export const useRiskStore = create<RiskState>((set, get) => ({
  dashboard: null,
  assessments: [],
  alerts: [],
  groupDetail: null,
  filterRiskLevel: null,
  filterCourseId: null,
  isLoading: false,
  error: null,
  lastRefresh: null,

  fetchDashboard: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await riskApi.getRiskDashboard(courseId);
      set({ dashboard, isLoading: false, lastRefresh: new Date().toISOString() });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch risk dashboard";
      set({ error: message, isLoading: false });
    }
  },

  fetchAssessments: async (courseId, riskLevel) => {
    set({ isLoading: true, error: null });
    try {
      const assessments = await riskApi.getRiskAssessments(courseId, riskLevel);
      set({ assessments, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch assessments";
      set({ error: message, isLoading: false });
    }
  },

  fetchAlerts: async (courseId, severity, acknowledged) => {
    try {
      const alerts = await riskApi.getRiskAlerts(courseId, severity, acknowledged);
      set({ alerts });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch alerts";
      set({ error: message });
    }
  },

  fetchGroupDetail: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      const groupDetail = await riskApi.getGroupRiskDetail(groupId);
      set({ groupDetail, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch group detail";
      set({ error: message, isLoading: false });
    }
  },

  runAssessment: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      const assessment = await riskApi.assessGroup(groupId);
      set((state) => ({
        assessments: state.assessments.map((a) =>
          a.projectGroupId === groupId ? assessment : a
        ),
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to run assessment";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  acknowledgeAlert: async (alertId, userId) => {
    try {
      await riskApi.acknowledgeAlert(alertId, userId);
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === alertId
            ? { ...a, isAcknowledged: true, acknowledgedAt: new Date().toISOString() }
            : a
        ),
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to acknowledge alert";
      set({ error: message });
      throw error;
    }
  },

  setFilterRiskLevel: (level) => set({ filterRiskLevel: level }),
  setFilterCourseId: (courseId) => set({ filterCourseId: courseId }),

  autoRefresh: async () => {
    const { lastRefresh } = get();
    try {
      const payload = await riskApi.getAutoRefresh(lastRefresh || undefined);
      if (payload?.assessments?.length > 0) {
        set((state) => ({
          assessments: state.assessments.map((a) => {
            const updated = payload.assessments.find((u) => u.projectGroupId === a.projectGroupId);
            return updated ? { ...a, riskLevel: updated.riskLevel as "Low" | "Medium" | "High", overallScore: updated.score } : a;
          }),
          lastRefresh: payload.timestamp,
        }));
      }
    } catch {
      // Silent fail for auto-refresh
    }
  },
}));
