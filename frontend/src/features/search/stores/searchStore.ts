"use client";

import { create } from "zustand";
import type { SearchResult } from "@/lib/search";
import * as searchApi from "@/lib/search";

interface SearchState {
  query: string;
  result: SearchResult | null;
  isSearching: boolean;
  isOpen: boolean;
  recentSearches: string[];
  setQuery: (q: string) => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  search: (q: string, workspaceId: string) => Promise<void>;
  clearResults: () => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
}

const RECENT_KEY = "syncspace_recent_searches";

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  result: null,
  isSearching: false,
  isOpen: false,
  recentSearches: loadRecent(),

  setQuery: (q) => set({ query: q }),

  setOpen: (open) => set({ isOpen: open }),

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),

  search: async (q, workspaceId) => {
    if (!q.trim() || q.trim().length < 2) {
      set({ result: null, isSearching: false });
      return;
    }

    set({ isSearching: true });
    try {
      const result = await searchApi.globalSearch(q, workspaceId);
      set({ result, isSearching: false });
      get().addRecentSearch(q.trim());
    } catch {
      set({ isSearching: false });
    }
  },

  clearResults: () => set({ result: null, query: "" }),

  addRecentSearch: (q) => {
    const current = get().recentSearches;
    const filtered = current.filter((s) => s !== q);
    const updated = [q, ...filtered].slice(0, 8);
    set({ recentSearches: updated });
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
    localStorage.removeItem(RECENT_KEY);
  },
}));
