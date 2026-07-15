import api from "./api";

export interface ProjectGroup {
  id: string;
  groupName: string;
  courseId: string;
  leaderId: string;
  leaderName: string;
  memberCount: number;
  workspaceCount: number;
  milestoneCount: number;
}

export interface ProjectGroupDetail extends ProjectGroup {
  courseName: string;
  courseCode: string;
  members: { userId: string; userName: string; email: string; avatarUrl?: string }[];
  workspaces: { id: string; name: string; description?: string }[];
  milestones: { id: string; title: string; description?: string; dueDate: string; isCompleted: boolean }[];
}

export async function getGroupsByCourse(courseId: string): Promise<ProjectGroup[]> {
  const res = await api.get<{ data: ProjectGroup[] }>(`/projectgroup/course/${courseId}`);
  return res.data.data;
}

export async function getGroup(id: string): Promise<ProjectGroupDetail> {
  const res = await api.get<{ data: ProjectGroupDetail }>(`/projectgroup/${id}`);
  return res.data.data;
}

export async function createGroup(data: { courseId: string; groupName: string }): Promise<ProjectGroup> {
  const res = await api.post<{ data: ProjectGroup }>("/projectgroup", data);
  return res.data.data;
}

export async function addGroupMember(groupId: string, email: string): Promise<void> {
  await api.post(`/projectgroup/${groupId}/members`, { email });
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await api.delete(`/projectgroup/${groupId}/members/${userId}`);
}

export async function deleteGroup(groupId: string): Promise<void> {
  await api.delete(`/projectgroup/${groupId}`);
}
