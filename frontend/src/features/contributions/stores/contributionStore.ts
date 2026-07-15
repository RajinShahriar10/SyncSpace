"use client";

import { create } from "zustand";
import * as contributionApi from "@/lib/contribution";

interface ContributionState {
  leaderboard: contributionApi.LeaderboardEntry[];
  weeklyActivity: contributionApi.WeeklyActivity[];
  summary: contributionApi.ContributionSummary | null;
  breakdown: contributionApi.ContributionBreakdown | null;
  topContributors: contributionApi.LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;

  fetchLeaderboard: (projectGroupId: string) => Promise<void>;
  fetchWeeklyActivity: (projectGroupId: string, weeks?: number) => Promise<void>;
  fetchSummary: (studentId: string, projectGroupId?: string) => Promise<void>;
  fetchBreakdown: (studentId: string, projectGroupId?: string) => Promise<void>;
  fetchTopContributors: (projectGroupId: string) => Promise<void>;
  recordActivity: (data: {
    activityType: string;
    referenceId?: string;
    workspaceId?: string;
    projectGroupId?: string;
  }) => Promise<void>;
}

export const useContributionStore = create<ContributionState>((set) => ({
  leaderboard: [],
  weeklyActivity: [],
  summary: null,
  breakdown: null,
  topContributors: [],
  isLoading: false,
  error: null,

  fetchLeaderboard: async (projectGroupId) => {
    set({ isLoading: true, error: null });
    try {
      const leaderboard = await contributionApi.getLeaderboard(projectGroupId);
      set({ leaderboard, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch leaderboard";
      set({ error: message, isLoading: false });
    }
  },

  fetchWeeklyActivity: async (projectGroupId, weeks = 4) => {
    set({ isLoading: true, error: null });
    try {
      const weeklyActivity = await contributionApi.getWeeklyActivity(projectGroupId, weeks);
      set({ weeklyActivity, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch weekly activity";
      set({ error: message, isLoading: false });
    }
  },

  fetchSummary: async (studentId, projectGroupId) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await contributionApi.getSummary(studentId, projectGroupId);
      set({ summary, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch summary";
      set({ error: message, isLoading: false });
    }
  },

  fetchBreakdown: async (studentId, projectGroupId) => {
    set({ isLoading: true, error: null });
    try {
      const breakdown = await contributionApi.getBreakdown(studentId, projectGroupId);
      set({ breakdown, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch breakdown";
      set({ error: message, isLoading: false });
    }
  },

  fetchTopContributors: async (projectGroupId) => {
    set({ isLoading: true, error: null });
    try {
      const topContributors = await contributionApi.getTopContributors(projectGroupId);
      set({ topContributors, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch top contributors";
      set({ error: message, isLoading: false });
    }
  },

  recordActivity: async (data) => {
    try {
      await contributionApi.recordActivity(data);
    } catch (error: unknown) {
      console.error("Failed to record activity:", error);
    }
  },
}));
