"use client";

import { create } from "zustand";
import type {
  DocumentDto,
  DocumentVersionDto,
  CommentDto,
  ReactionDto,
} from "@/lib/document";
import * as docApi from "@/lib/document";

interface DocumentState {
  currentDocument: DocumentDto | null;
  documents: DocumentDto[];
  versions: DocumentVersionDto[];
  comments: CommentDto[];
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  onlineUsers: PresenceUser[];

  fetchDocument: (id: string) => Promise<void>;
  fetchWorkspaceDocuments: (workspaceId: string) => Promise<void>;
  updateDocument: (id: string, data: { title?: string; content?: string }) => Promise<void>;
  createDocument: (data: docApi.CreateDocumentRequest) => Promise<DocumentDto>;
  deleteDocument: (id: string) => Promise<void>;
  fetchVersions: (documentId: string) => Promise<void>;
  restoreVersion: (documentId: string, versionNumber: number) => Promise<void>;
  fetchComments: (documentId: string) => Promise<void>;
  addComment: (documentId: string, data: docApi.AddCommentRequest) => Promise<CommentDto>;
  resolveComment: (commentId: string, isResolved: boolean) => Promise<void>;
  addReaction: (commentId: string, emoji: string) => Promise<ReactionDto>;
  removeReaction: (commentId: string, emoji: string) => Promise<void>;
  setOnlineUsers: (users: PresenceUser[]) => void;
  updateLocalDocument: (data: Partial<DocumentDto>) => void;
}

export interface PresenceUser {
  userId: string;
  userName: string;
  avatarUrl?: string;
  connectionId: string;
  lastActive: string;
  color?: string;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  currentDocument: null,
  documents: [],
  versions: [],
  comments: [],
  isLoading: false,
  isSaving: false,
  lastSaved: null,
  error: null,
  onlineUsers: [],

  fetchDocument: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const doc = await docApi.getDocument(id);
      set({ currentDocument: doc, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load document";
      set({ error: message, isLoading: false });
    }
  },

  fetchWorkspaceDocuments: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const docs = await docApi.getWorkspaceDocuments(workspaceId);
      set({ documents: docs, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load documents";
      set({ error: message, isLoading: false });
    }
  },

  updateDocument: async (id, data) => {
    set({ isSaving: true });
    try {
      const doc = await docApi.updateDocument(id, data);
      set({ currentDocument: doc, isSaving: false, lastSaved: new Date() });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save";
      set({ error: message, isSaving: false });
    }
  },

  createDocument: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const doc = await docApi.createDocument(data);
      set((state) => ({
        documents: [doc, ...state.documents],
        isLoading: false,
      }));
      return doc;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create document";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteDocument: async (id) => {
    try {
      await docApi.deleteDocument(id);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete";
      set({ error: message });
    }
  },

  fetchVersions: async (documentId) => {
    try {
      const versions = await docApi.getDocumentVersions(documentId);
      set({ versions });
    } catch {
      set({ versions: [] });
    }
  },

  restoreVersion: async (documentId, versionNumber) => {
    try {
      const doc = await docApi.restoreVersion(documentId, versionNumber);
      set({ currentDocument: doc, lastSaved: new Date() });
      await get().fetchVersions(documentId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to restore version";
      set({ error: message });
    }
  },

  fetchComments: async (documentId) => {
    try {
      const comments = await docApi.getDocumentComments(documentId);
      set({ comments });
    } catch {
      set({ comments: [] });
    }
  },

  addComment: async (documentId, data) => {
    const comment = await docApi.addComment(documentId, data);
    set((state) => ({ comments: [...state.comments, comment] }));
    return comment;
  },

  resolveComment: async (commentId, isResolved) => {
    await docApi.resolveComment(commentId, isResolved);
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === commentId ? { ...c, isResolved } : c
      ),
    }));
  },

  addReaction: async (commentId, emoji) => {
    const reaction = await docApi.addReaction(commentId, emoji);
    set((state) => ({
      comments: state.comments.map((c) => {
        if (c.id !== commentId) return c;
        const existing = c.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          return {
            ...c,
            reactions: c.reactions.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            ),
          };
        }
        return { ...c, reactions: [...c.reactions, reaction] };
      }),
    }));
    return reaction;
  },

  removeReaction: async (commentId, emoji) => {
    await docApi.removeReaction(commentId, emoji);
    set((state) => ({
      comments: state.comments.map((c) => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          reactions: c.reactions
            .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1 } : r))
            .filter((r) => r.count > 0),
        };
      }),
    }));
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),
  updateLocalDocument: (data) =>
    set((state) => ({
      currentDocument: state.currentDocument
        ? { ...state.currentDocument, ...data }
        : null,
    })),
}));
