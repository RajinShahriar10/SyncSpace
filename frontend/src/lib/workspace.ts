import api from "./api";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  ownerId: string;
  plan: string;
  createdAt: string;
  memberCount: number;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userAvatarUrl?: string;
  role: string;
  joinedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: string;
}

export interface UpdateRoleRequest {
  role: string;
}

// --- Workspace CRUD ---

export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await api.get<{ data: Workspace[] }>("/workspace");
  return response.data.data;
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const response = await api.get<{ data: Workspace }>(`/workspace/${id}`);
  return response.data.data;
}

export async function createWorkspace(data: CreateWorkspaceRequest): Promise<Workspace> {
  const response = await api.post<{ data: Workspace }>("/workspace", data);
  return response.data.data;
}

export async function updateWorkspace(id: string, data: UpdateWorkspaceRequest): Promise<Workspace> {
  const response = await api.put<{ data: Workspace }>(`/workspace/${id}`, data);
  return response.data.data;
}

export async function deleteWorkspace(id: string): Promise<void> {
  await api.delete(`/workspace/${id}`);
}

// --- Members ---

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const response = await api.get<{ data: WorkspaceMember[] }>(`/workspace/${workspaceId}/members`);
  return response.data.data;
}

export async function inviteMember(workspaceId: string, data: InviteMemberRequest): Promise<WorkspaceMember> {
  const response = await api.post<{ data: WorkspaceMember }>(`/workspace/${workspaceId}/members`, data);
  return response.data.data;
}

export async function removeMember(workspaceId: string, userId: string): Promise<void> {
  await api.delete(`/workspace/${workspaceId}/members/${userId}`);
}

export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  data: UpdateRoleRequest
): Promise<WorkspaceMember> {
  const response = await api.put<{ data: WorkspaceMember }>(
    `/workspace/${workspaceId}/members/${userId}/role`,
    data
  );
  return response.data.data;
}
