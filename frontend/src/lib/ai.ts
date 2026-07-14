import api from "./api";

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
}

export async function summarize(content: string, style = "concise"): Promise<AIResponse> {
  const res = await api.post("/ai/summarize", { content, style });
  return res.data.data;
}

export async function generateMeetingNotes(content: string): Promise<AIResponse> {
  const res = await api.post("/ai/meeting-notes", { content });
  return res.data.data;
}

export async function rewrite(content: string, tone = "professional"): Promise<AIResponse> {
  const res = await api.post("/ai/rewrite", { content, tone });
  return res.data.data;
}

export async function createTaskList(content: string): Promise<AIResponse> {
  const res = await api.post("/ai/tasks", { content });
  return res.data.data;
}

export async function extractActionItems(content: string): Promise<AIResponse> {
  const res = await api.post("/ai/action-items", { content });
  return res.data.data;
}

export async function chat(prompt: string, context?: string): Promise<AIResponse> {
  const res = await api.post("/ai/chat", { prompt, context });
  return res.data.data;
}
