"use client";

import { create } from "zustand";
import * as milestoneApi from "@/lib/milestone";

interface MilestoneState {
  milestones: milestoneApi.Milestone[];
  isLoading: boolean;
  error: string | null;
  fetchMilestones: (groupId: string) => Promise<void>;
  createMilestone: (data: { title: string; description?: string; dueDate: string; projectGroupId: string }) => Promise<milestoneApi.Milestone>;
  updateMilestone: (id: string, data: { title?: string; description?: string; dueDate?: string; isCompleted?: boolean }) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
}

export const useMilestoneStore = create<MilestoneState>((set) => ({
  milestones: [],
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
}));
