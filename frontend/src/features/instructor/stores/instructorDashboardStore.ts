"use client";

import { create } from "zustand";
import * as dashApi from "@/lib/instructorDashboard";

interface InstructorDashboardState {
  overview: dashApi.CourseOverview | null;
  groups: dashApi.GroupMonitoring[];
  healthScores: Record<string, dashApi.GroupHealthScoreData>;
  contributions: dashApi.ContributionMonitoringData | null;
  timeline: dashApi.ActivityTimelineEntry[];
  heatmap: dashApi.ParticipationHeatmapEntry[];
  selectedCourseId: string | null;
  isLoading: boolean;
  error: string | null;

  setSelectedCourse: (courseId: string) => void;
  fetchOverview: (courseId: string) => Promise<void>;
  fetchGroups: (courseId: string) => Promise<void>;
  fetchHealthScore: (groupId: string) => Promise<void>;
  fetchContributions: (courseId: string) => Promise<void>;
  fetchTimeline: (courseId: string, days?: number) => Promise<void>;
  fetchHeatmap: (courseId: string) => Promise<void>;
  fetchAll: (courseId: string) => Promise<void>;
}

export const useInstructorDashboardStore = create<InstructorDashboardState>((set, get) => ({
  overview: null,
  groups: [],
  healthScores: {},
  contributions: null,
  timeline: [],
  heatmap: [],
  selectedCourseId: null,
  isLoading: false,
  error: null,

  setSelectedCourse: (courseId) => set({ selectedCourseId: courseId }),

  fetchOverview: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const overview = await dashApi.getCourseOverview(courseId);
      set({ overview, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch overview";
      set({ error: message, isLoading: false });
    }
  },

  fetchGroups: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const groups = await dashApi.getGroupMonitoring(courseId);
      set({ groups, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch groups";
      set({ error: message, isLoading: false });
    }
  },

  fetchHealthScore: async (groupId) => {
    try {
      const health = await dashApi.getGroupHealthScore(groupId);
      set((state) => ({
        healthScores: { ...state.healthScores, [groupId]: health },
      }));
    } catch (error: unknown) {
      console.error("Failed to fetch health score:", error);
    }
  },

  fetchContributions: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const contributions = await dashApi.getContributionMonitoring(courseId);
      set({ contributions, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch contributions";
      set({ error: message, isLoading: false });
    }
  },

  fetchTimeline: async (courseId, days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const timeline = await dashApi.getActivityTimeline(courseId, days);
      set({ timeline, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch timeline";
      set({ error: message, isLoading: false });
    }
  },

  fetchHeatmap: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const heatmap = await dashApi.getParticipationHeatmap(courseId);
      set({ heatmap, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch heatmap";
      set({ error: message, isLoading: false });
    }
  },

  fetchAll: async (courseId) => {
    set({ isLoading: true, error: null, selectedCourseId: courseId });
    try {
      const [overview, groups, contributions, timeline, heatmap] = await Promise.all([
        dashApi.getCourseOverview(courseId),
        dashApi.getGroupMonitoring(courseId),
        dashApi.getContributionMonitoring(courseId),
        dashApi.getActivityTimeline(courseId, 30),
        dashApi.getParticipationHeatmap(courseId),
      ]);
      set({ overview, groups, contributions, timeline, heatmap, isLoading: false });

      // Fetch health scores for all groups
      for (const group of groups) {
        get().fetchHealthScore(group.groupId);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch dashboard data";
      set({ error: message, isLoading: false });
    }
  },
}));
