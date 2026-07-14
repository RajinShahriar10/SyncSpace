"use client";

import { create } from "zustand";
import type { Workspace, WorkspaceMember } from "@/lib/workspace";
import * as workspaceApi from "@/lib/workspace";

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  members: WorkspaceMember[];
  isLoading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (data: workspaceApi.CreateWorkspaceRequest) => Promise<Workspace>;
  updateWorkspace: (id: string, data: workspaceApi.UpdateWorkspaceRequest) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  fetchMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, data: workspaceApi.InviteMemberRequest) => Promise<void>;
  removeMember: (workspaceId: string, userId: string) => Promise<void>;
  updateMemberRole: (workspaceId: string, userId: string, role: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  members: [],
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspaces = await workspaceApi.getWorkspaces();
      set({ workspaces, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch workspaces";
      set({ error: message, isLoading: false });
    }
  },

  fetchWorkspace: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const workspace = await workspaceApi.getWorkspace(id);
      set({ currentWorkspace: workspace, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch workspace";
      set({ error: message, isLoading: false });
    }
  },

  createWorkspace: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const workspace = await workspaceApi.createWorkspace(data);
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
        isLoading: false,
      }));
      return workspace;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create workspace";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateWorkspace: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await workspaceApi.updateWorkspace(id, data);
      set((state) => ({
        workspaces: state.workspaces.map((w) => (w.id === id ? updated : w)),
        currentWorkspace: state.currentWorkspace?.id === id ? updated : state.currentWorkspace,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update workspace";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteWorkspace: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceApi.deleteWorkspace(id);
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
        currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete workspace";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchMembers: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const members = await workspaceApi.getWorkspaceMembers(workspaceId);
      set({ members, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch members";
      set({ error: message, isLoading: false });
    }
  },

  inviteMember: async (workspaceId, data) => {
    set({ error: null });
    try {
      const member = await workspaceApi.inviteMember(workspaceId, data);
      set((state) => ({ members: [...state.members, member] }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to invite member";
      set({ error: message });
      throw error;
    }
  },

  removeMember: async (workspaceId, userId) => {
    set({ error: null });
    try {
      await workspaceApi.removeMember(workspaceId, userId);
      set((state) => ({
        members: state.members.filter((m) => m.userId !== userId),
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to remove member";
      set({ error: message });
      throw error;
    }
  },

  updateMemberRole: async (workspaceId, userId, role) => {
    set({ error: null });
    try {
      const updated = await workspaceApi.updateMemberRole(workspaceId, userId, { role });
      set((state) => ({
        members: state.members.map((m) => (m.userId === userId ? updated : m)),
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update role";
      set({ error: message });
      throw error;
    }
  },

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  clearError: () => set({ error: null }),
}));
