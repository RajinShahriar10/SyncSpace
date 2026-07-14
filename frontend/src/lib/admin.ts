import api from "./api";

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  totalWorkspaces: number;
  totalDocuments: number;
  totalMessages: number;
  totalFiles: number;
  totalStorageBytes: number;
  totalTasks: number;
  usersLast30Days: number;
  documentsLast30Days: number;
  messagesLast30Days: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  status: string;
  workspaceCount: number;
  documentCount: number;
  messageCount: number;
  createdAt: string;
}

export interface AdminWorkspace {
  id: string;
  name: string;
  description: string;
  ownerName: string;
  memberCount: number;
  documentCount: number;
  boardCount: number;
  createdAt: string;
}

export interface AdminDocument {
  id: string;
  title: string;
  authorName: string;
  workspaceName: string;
  wordCount: number;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface StorageByWorkspace { workspaceId: string; workspaceName: string; sizeBytes: number; fileCount: number; }
export interface StorageByType { fileType: string; sizeBytes: number; fileCount: number; }
export interface StorageOverview { totalStorageBytes: number; totalFiles: number; byWorkspace: StorageByWorkspace[]; byType: StorageByType[]; }

export interface SystemHealth {
  status: string;
  databaseConnected: boolean;
  databaseResponseMs: number;
  runtimeVersion: string;
  serverTime: string;
  processMemoryMB: number;
  threadCount: number;
  uptimeDays: number;
  checks: Record<string, string>;
}

export interface AdminAuditLog {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> { data: T[]; pagination: { page: number; pageSize: number; totalCount: number; totalPages: number }; }

export async function getOverview(): Promise<AdminOverview> {
  const res = await api.get("/admin/overview");
  return res.data.data;
}

export async function getUsers(search?: string, page = 1): Promise<PaginatedResponse<AdminUser>> {
  const res = await api.get("/admin/users", { params: { search, page, pageSize: 20 } });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function updateUser(req: { id: string; firstName?: string; lastName?: string; email?: string; status?: string }) {
  const res = await api.put("/admin/users", req);
  return res.data;
}

export async function deleteUser(id: string) {
  const res = await api.delete(`/admin/users/${id}`);
  return res.data;
}

export async function getWorkspaces(search?: string, page = 1): Promise<PaginatedResponse<AdminWorkspace>> {
  const res = await api.get("/admin/workspaces", { params: { search, page, pageSize: 20 } });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function updateWorkspace(req: { id: string; name?: string; description?: string }) {
  const res = await api.put("/admin/workspaces", req);
  return res.data;
}

export async function deleteWorkspace(id: string) {
  const res = await api.delete(`/admin/workspaces/${id}`);
  return res.data;
}

export async function getDocuments(search?: string, page = 1): Promise<PaginatedResponse<AdminDocument>> {
  const res = await api.get("/admin/documents", { params: { search, page, pageSize: 20 } });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function deleteDocument(id: string) {
  const res = await api.delete(`/admin/documents/${id}`);
  return res.data;
}

export async function getStorage(): Promise<StorageOverview> {
  const res = await api.get("/admin/storage");
  return res.data.data;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const res = await api.get("/admin/health");
  return res.data.data;
}

export async function getAuditLogs(params: { action?: string; userId?: string; page?: number }): Promise<PaginatedResponse<AdminAuditLog>> {
  const res = await api.get("/admin/audit", { params: { ...params, pageSize: 30 } });
  return { data: res.data.data, pagination: res.data.pagination };
}
