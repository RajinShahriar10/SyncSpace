"use client";

import { create } from "zustand";
import * as groupApi from "@/lib/projectGroup";

interface ProjectGroupState {
  groups: groupApi.ProjectGroup[];
  currentGroup: groupApi.ProjectGroupDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchGroupsByCourse: (courseId: string) => Promise<void>;
  fetchGroup: (id: string) => Promise<void>;
  createGroup: (data: { courseId: string; groupName: string }) => Promise<groupApi.ProjectGroup>;
  addMember: (groupId: string, email: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
}

export const useProjectGroupStore = create<ProjectGroupState>((set) => ({
  groups: [],
  currentGroup: null,
  isLoading: false,
  error: null,

  fetchGroupsByCourse: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const groups = await groupApi.getGroupsByCourse(courseId);
      set({ groups, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch groups";
      set({ error: message, isLoading: false });
    }
  },

  fetchGroup: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const group = await groupApi.getGroup(id);
      set({ currentGroup: group, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch group";
      set({ error: message, isLoading: false });
    }
  },

  createGroup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const group = await groupApi.createGroup(data);
      set((state) => ({ groups: [...state.groups, group], isLoading: false }));
      return group;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create group";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  addMember: async (groupId, email) => {
    await groupApi.addGroupMember(groupId, email);
  },

  removeMember: async (groupId, userId) => {
    await groupApi.removeGroupMember(groupId, userId);
    set((state) => ({
      currentGroup: state.currentGroup
        ? { ...state.currentGroup, members: state.currentGroup.members.filter((m) => m.userId !== userId) }
        : null,
    }));
  },

  deleteGroup: async (groupId) => {
    await groupApi.deleteGroup(groupId);
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
    }));
  },
}));
