"use client";

import { create } from "zustand";
import * as aiApi from "@/lib/ai";

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: string;
  tokensUsed?: number;
  timestamp: Date;
}

interface AIState {
  messages: AIMessage[];
  isLoading: boolean;
  isOpen: boolean;
  error: string | null;

  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  clearMessages: () => void;
  clearError: () => void;

  sendMessage: (prompt: string, context?: string) => Promise<void>;
  summarize: (content: string, style?: string) => Promise<void>;
  generateMeetingNotes: (content: string) => Promise<void>;
  rewrite: (content: string, tone?: string) => Promise<void>;
  createTaskList: (content: string) => Promise<void>;
  extractActionItems: (content: string) => Promise<void>;
}

let idCounter = 0;
const genId = () => `ai-${Date.now()}-${++idCounter}`;

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isLoading: false,
  isOpen: false,
  error: null,

  toggleSidebar: () => set((s) => ({ isOpen: !s.isOpen })),
  openSidebar: () => set({ isOpen: true }),
  closeSidebar: () => set({ isOpen: false }),
  clearMessages: () => set({ messages: [] }),
  clearError: () => set({ error: null }),

  sendMessage: async (prompt, context) => {
    const userMsg: AIMessage = { id: genId(), role: "user", content: prompt, timestamp: new Date() };
    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true, error: null }));
    try {
      const res = await aiApi.chat(prompt, context);
      const aiMsg: AIMessage = { id: genId(), role: "assistant", content: res.content, tokensUsed: res.tokensUsed, timestamp: new Date() };
      set((s) => ({ messages: [...s.messages, aiMsg], isLoading: false }));
    } catch {
      set({ isLoading: false, error: "Failed to get AI response. Check your OpenAI API key." });
    }
  },

  summarize: async (content, style = "concise") => {
    const userMsg: AIMessage = { id: genId(), role: "user", content: "Summarize this document", action: "summarize", timestamp: new Date() };
    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true, error: null }));
    try {
      const res = await aiApi.summarize(content, style);
      const aiMsg: AIMessage = { id: genId(), role: "assistant", content: res.content, action: "summarize", tokensUsed: res.tokensUsed, timestamp: new Date() };
      set((s) => ({ messages: [...s.messages, aiMsg], isLoading: false }));
    } catch {
      set({ isLoading: false, error: "Failed to summarize. Check your OpenAI API key." });
    }
  },

  generateMeetingNotes: async (content) => {
    const userMsg: AIMessage = { id: genId(), role: "user", content: "Generate meeting notes", action: "meeting-notes", timestamp: new Date() };
    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true, error: null }));
    try {
      const res = await aiApi.generateMeetingNotes(content);
      const aiMsg: AIMessage = { id: genId(), role: "assistant", content: res.content, action: "meeting-notes", tokensUsed: res.tokensUsed, timestamp: new Date() };
      set((s) => ({ messages: [...s.messages, aiMsg], isLoading: false }));
    } catch {
      set({ isLoading: false, error: "Failed to generate notes. Check your OpenAI API key." });
    }
  },

  rewrite: async (content, tone = "professional") => {
    const userMsg: AIMessage = { id: genId(), role: "user", content: `Rewrite (${tone})`, action: "rewrite", timestamp: new Date() };
    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true, error: null }));
    try {
      const res = await aiApi.rewrite(content, tone);
      const aiMsg: AIMessage = { id: genId(), role: "assistant", content: res.content, action: "rewrite", tokensUsed: res.tokensUsed, timestamp: new Date() };
      set((s) => ({ messages: [...s.messages, aiMsg], isLoading: false }));
    } catch {
      set({ isLoading: false, error: "Failed to rewrite. Check your OpenAI API key." });
    }
  },

  createTaskList: async (content) => {
    const userMsg: AIMessage = { id: genId(), role: "user", content: "Create task list", action: "tasks", timestamp: new Date() };
    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true, error: null }));
    try {
      const res = await aiApi.createTaskList(content);
      const aiMsg: AIMessage = { id: genId(), role: "assistant", content: res.content, action: "tasks", tokensUsed: res.tokensUsed, timestamp: new Date() };
      set((s) => ({ messages: [...s.messages, aiMsg], isLoading: false }));
    } catch {
      set({ isLoading: false, error: "Failed to create tasks. Check your OpenAI API key." });
    }
  },

  extractActionItems: async (content) => {
    const userMsg: AIMessage = { id: genId(), role: "user", content: "Extract action items", action: "actions", timestamp: new Date() };
    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true, error: null }));
    try {
      const res = await aiApi.extractActionItems(content);
      const aiMsg: AIMessage = { id: genId(), role: "assistant", content: res.content, action: "actions", tokensUsed: res.tokensUsed, timestamp: new Date() };
      set((s) => ({ messages: [...s.messages, aiMsg], isLoading: false }));
    } catch {
      set({ isLoading: false, error: "Failed to extract actions. Check your OpenAI API key." });
    }
  },
}));
