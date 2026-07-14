import api from "./api";

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  action: string;
  entityType: string;
  entityId?: string;
  workspaceId?: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export async function getAuditLogs(params: {
  workspaceId?: string;
  action?: string;
  entityType?: string;
  page?: number;
  pageSize?: number;
}): Promise<AuditLogResponse> {
  const q = new URLSearchParams();
  if (params.workspaceId) q.set("workspaceId", params.workspaceId);
  if (params.action) q.set("action", params.action);
  if (params.entityType) q.set("entityType", params.entityType);
  if (params.page) q.set("page", params.page.toString());
  if (params.pageSize) q.set("pageSize", params.pageSize.toString());
  const res = await api.get<AuditLogResponse>("/audit", { params: q });
  return res.data;
}
