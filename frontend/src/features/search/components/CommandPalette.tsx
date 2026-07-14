"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, CheckSquare, MessageSquare, User, File, Clock, X, Loader2, CornerDownLeft } from "lucide-react";
import { useSearchStore } from "@/features/search/stores/searchStore";
import { useWorkspaceSelectionStore } from "@/store";
import { formatRelativeTime } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  documents: FileText,
  tasks: CheckSquare,
  chats: MessageSquare,
  users: User,
  files: File,
};

const CATEGORY_COLORS: Record<string, string> = {
  documents: "text-[#6366F1]",
  tasks: "text-[#F59E0B]",
  chats: "text-[#10B981]",
  users: "text-[#8B5CF6]",
  files: "text-[#06B6D4]",
};

const ITEM_ICONS: Record<string, typeof FileText> = {
  "file-text": FileText,
  "check-square": CheckSquare,
  "message-square": MessageSquare,
  user: User,
  file: File,
};

export default function CommandPalette() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query, result, isSearching, isOpen, recentSearches,
    setQuery, setOpen, search, clearResults, clearRecentSearches,
  } = useSearchStore();

  const currentWorkspaceId = useWorkspaceSelectionStore((s) => s.currentWorkspaceId);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
      if (e.key === "Escape" && isOpen) {
        setOpen(false);
        clearResults();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen, clearResults]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setSelectedCategory(null);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !currentWorkspaceId) return;
    const timer = setTimeout(() => {
      search(query, currentWorkspaceId);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, currentWorkspaceId, search]);

  const allItems = result?.categories
    .filter((c) => !selectedCategory || c.category === selectedCategory)
    .flatMap((c) => c.items) ?? [];

  const handleSelect = useCallback((item: typeof allItems[0]) => {
    if (item.url) {
      router.push(item.url);
    }
    setOpen(false);
    clearResults();
  }, [router, setOpen, clearResults]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems[selectedIndex]) {
      handleSelect(allItems[selectedIndex]);
    }
  }, [allItems, selectedIndex, handleSelect]);

  const categories = result?.categories ?? [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setOpen(false); clearResults(); }} />

      <div className="relative w-full max-w-2xl mx-4 sm:mx-0 rounded-2xl border border-white/10 bg-[#0E0E18] shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 border-b border-white/10">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-[#6366F1] animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-zinc-500 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search documents, tasks, messages, people, files..."
            className="flex-1 h-14 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(""); clearResults(); }} className="text-zinc-600 hover:text-zinc-400">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="flex-shrink-0 text-[10px] text-zinc-600 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1 px-5 py-2 border-b border-white/10 overflow-x-auto">
            <button
              onClick={() => { setSelectedCategory(null); setSelectedIndex(0); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                !selectedCategory ? "bg-[#6366F1]/20 text-[#6366F1]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              All ({result?.totalCount ?? 0})
            </button>
            {categories.map((c) => {
              const Icon = CATEGORY_ICONS[c.category] || FileText;
              return (
                <button
                  key={c.category}
                  onClick={() => { setSelectedCategory(c.category); setSelectedIndex(0); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                    selectedCategory === c.category ? "bg-white/10 text-zinc-200" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${CATEGORY_COLORS[c.category] || ""}`} />
                  {c.label}
                  <span className="text-zinc-600 ml-0.5">{c.totalCount}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto p-2">
          {result && allItems.length === 0 && !isSearching && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-zinc-600 mt-1">Try different keywords</p>
            </div>
          )}

          {!result && !isSearching && recentSearches.length > 0 && (
            <div className="py-1">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-zinc-600 font-medium">Recent searches</span>
                <button onClick={clearRecentSearches} className="text-xs text-zinc-600 hover:text-zinc-400">Clear</button>
              </div>
              {recentSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-all"
                >
                  <Clock className="w-4 h-4 text-zinc-600" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {!result && !isSearching && recentSearches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-[#6366F1]" />
              </div>
              <p className="text-sm text-zinc-400">Search across your workspace</p>
              <p className="text-xs text-zinc-600 mt-1">Documents, tasks, messages, people, and files</p>
            </div>
          )}

          {allItems.map((item, i) => {
            const Icon = ITEM_ICONS[item.icon || ""] || FileText;
            const colorClass = CATEGORY_COLORS[result?.categories.find((c) => c.items.some((it) => it.id === item.id))?.category || ""] || "text-zinc-400";

            return (
              <button
                key={item.id + item.title}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`flex items-start gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all ${
                  i === selectedIndex ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200 truncate">{item.title}</span>
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{item.subtitle}</p>
                  )}
                  {item.snippet && (
                    <p className="text-xs text-zinc-600 truncate mt-0.5 line-clamp-1">{item.snippet}</p>
                  )}
                </div>
                {item.url && (
                  <CornerDownLeft className="flex-shrink-0 w-3.5 h-3.5 text-zinc-600 mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3 text-[11px] text-zinc-600">
            <span className="flex items-center gap-1"><kbd className="bg-white/5 border border-white/10 rounded px-1 py-0.5">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-white/5 border border-white/10 rounded px-1 py-0.5">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="bg-white/5 border border-white/10 rounded px-1 py-0.5">esc</kbd> close</span>
          </div>
          {result && (
            <span className="text-[11px] text-zinc-600">{result.totalCount} results in {result.elapsedMs}ms</span>
          )}
        </div>
      </div>
    </div>
  );
}
