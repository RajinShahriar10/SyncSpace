"use client";

import { create } from "zustand";
import * as milestoneApi from "@/lib/milestone";

interface MilestoneState {
  milestones: milestoneApi.Milestone[];
  progress: milestoneApi.MilestoneProgress | null;
  timeline: milestoneApi.MilestoneTimelineEntry[];
  history: milestoneApi.MilestoneHistoryEntry[];
  reminders: milestoneApi.MilestoneReminderDto[];
  isLoading: boolean;
  error: string | null;

  fetchMilestones: (groupId: string) => Promise<void>;
  fetchProgress: (groupId: string) => Promise<void>;
  fetchTimeline: (groupId: string) => Promise<void>;
  fetchHistory: (groupId: string) => Promise<void>;
  fetchReminders: (milestoneId: string) => Promise<void>;

  createMilestone: (data: {
    title: string;
    description?: string;
    startDate: string;
    dueDate: string;
    projectGroupId: string;
    order?: number;
    assignedUserIds?: string[];
  }) => Promise<milestoneApi.Milestone>;

  updateMilestone: (
    id: string,
    data: {
      title?: string;
      description?: string;
      startDate?: string;
      dueDate?: string;
      status?: string;
      order?: number;
      assignedUserIds?: string[];
    }
  ) => Promise<void>;

  deleteMilestone: (id: string) => Promise<void>;
  completeMilestone: (id: string) => Promise<void>;
  assignMembers: (milestoneId: string, userIds: string[]) => Promise<void>;
  generateReminders: (milestoneId: string) => Promise<milestoneApi.MilestoneReminderDto[]>;
}

export const useMilestoneStore = create<MilestoneState>((set) => ({
  milestones: [],
  progress: null,
  timeline: [],
  history: [],
  reminders: [],
  isLoading: false,
  error: null,

  fetchMilestones: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      const milestones = await milestoneApi.getMilestonesByGroup(groupId);
      set({ milestones, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch milestones";
      set({ error: message, isLoading: false });
    }
  },

  fetchProgress: async (groupId) => {
    try {
      const progress = await milestoneApi.getMilestoneProgress(groupId);
      set({ progress });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch progress";
      set({ error: message });
    }
  },

  fetchTimeline: async (groupId) => {
    try {
      const timeline = await milestoneApi.getMilestoneTimeline(groupId);
      set({ timeline });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch timeline";
      set({ error: message });
    }
  },

  fetchHistory: async (groupId) => {
    try {
      const history = await milestoneApi.getMilestoneHistory(groupId);
      set({ history });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch history";
      set({ error: message });
    }
  },

  fetchReminders: async (milestoneId) => {
    try {
      const reminders = await milestoneApi.getMilestoneReminders(milestoneId);
      set({ reminders });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch reminders";
      set({ error: message });
    }
  },

  createMilestone: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const milestone = await milestoneApi.createMilestone(data);
      set((state) => ({ milestones: [...state.milestones, milestone], isLoading: false }));
      return milestone;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create milestone";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateMilestone: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await milestoneApi.updateMilestone(id, data);
      set((state) => ({
        milestones: state.milestones.map((m) => (m.id === id ? updated : m)),
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update milestone";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteMilestone: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await milestoneApi.deleteMilestone(id);
      set((state) => ({
        milestones: state.milestones.filter((m) => m.id !== id),
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete milestone";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  completeMilestone: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await milestoneApi.completeMilestone(id);
      set((state) => ({
        milestones: state.milestones.map((m) =>
          m.id === id ? { ...m, status: "Completed" as const, isCompleted: true } : m
        ),
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to complete milestone";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  assignMembers: async (milestoneId, userIds) => {
    try {
      await milestoneApi.assignMilestoneMembers(milestoneId, userIds);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to assign members";
      set({ error: message });
      throw error;
    }
  },

  generateReminders: async (milestoneId) => {
    try {
      const reminders = await milestoneApi.generateMilestoneReminders(milestoneId);
      set({ reminders });
      return reminders;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate reminders";
      set({ error: message });
      throw error;
    }
  },
}));
