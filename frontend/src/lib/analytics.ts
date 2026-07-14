import api from "./api";

export interface WorkspaceOverview {
  activeUsers: number;
  totalMembers: number;
  totalDocuments: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  totalMessages: number;
  totalFiles: number;
  totalStorageBytes: number;
  activeUsersLast7Days: number;
}

export interface WorkspaceGrowth {
  label: string;
  members: number;
  documents: number;
  tasks: number;
  messages: number;
}

export interface TopMember {
  userId: string;
  fullName: string;
  avatarUrl: string;
  taskCount: number;
  documentCount: number;
  messageCount: number;
  totalActivity: number;
}

export interface TaskStatus {
  columnName: string;
  count: number;
}

export interface TimelinePoint {
  label: string;
  value: number;
}

export async function getWorkspaceOverview(id: string): Promise<WorkspaceOverview> {
  const res = await api.get(`/analytics/workspace/${id}`);
  return res.data.data;
}

export async function getWorkspaceGrowth(id: string, months = 6): Promise<WorkspaceGrowth[]> {
  const res = await api.get(`/analytics/workspace/${id}/growth`, { params: { months } });
  return res.data.data;
}

export async function getTopMembers(id: string, limit = 10): Promise<TopMember[]> {
  const res = await api.get(`/analytics/workspace/${id}/members/top`, { params: { limit } });
  return res.data.data;
}

export async function getTaskStatus(id: string): Promise<TaskStatus[]> {
  const res = await api.get(`/analytics/workspace/${id}/tasks/status`);
  return res.data.data;
}

export async function getDocumentTimeline(id: string, months = 6): Promise<TimelinePoint[]> {
  const res = await api.get(`/analytics/workspace/${id}/documents/timeline`, { params: { months } });
  return res.data.data;
}

export async function getMessageTimeline(id: string, months = 6): Promise<TimelinePoint[]> {
  const res = await api.get(`/analytics/workspace/${id}/messages/timeline`, { params: { months } });
  return res.data.data;
}
