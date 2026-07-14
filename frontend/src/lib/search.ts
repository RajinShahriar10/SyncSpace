import api from "./api";

export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  url?: string;
  score: number;
  icon?: string;
  createdAt: string;
}

export interface SearchCategory {
  category: string;
  label: string;
  totalCount: number;
  items: SearchItem[];
}

export interface SearchResult {
  query: string;
  totalCount: number;
  categories: SearchCategory[];
  elapsedMs: number;
}

export async function globalSearch(
  q: string,
  workspaceId: string,
  category?: string,
  limit = 20
): Promise<SearchResult> {
  const params = new URLSearchParams({ q, workspaceId, limit: limit.toString() });
  if (category) params.set("category", category);
  const res = await api.get<{ data: SearchResult }>("/search", { params });
  return res.data.data;
}
