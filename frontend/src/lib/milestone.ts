import api from "./api";

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  projectGroupId: string;
}

export async function getMilestonesByGroup(groupId: string): Promise<Milestone[]> {
  const res = await api.get<{ data: Milestone[] }>(`/milestone/group/${groupId}`);
  return res.data.data;
}

export async function getMilestone(id: string): Promise<Milestone> {
  const res = await api.get<{ data: Milestone }>(`/milestone/${id}`);
  return res.data.data;
}

export async function createMilestone(data: { title: string; description?: string; dueDate: string; projectGroupId: string }): Promise<Milestone> {
  const res = await api.post<{ data: Milestone }>("/milestone", data);
  return res.data.data;
}

export async function updateMilestone(id: string, data: { title?: string; description?: string; dueDate?: string; isCompleted?: boolean }): Promise<Milestone> {
  const res = await api.put<{ data: Milestone }>(`/milestone/${id}`, data);
  return res.data.data;
}

export async function deleteMilestone(id: string): Promise<void> {
  await api.delete(`/milestone/${id}`);
}
