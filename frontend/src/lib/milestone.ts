import api from "./api";

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  dueDate: string;
  status: "NotStarted" | "InProgress" | "Completed" | "Delayed" | "Cancelled";
  isCompleted: boolean;
  completedAt?: string;
  projectGroupId: string;
  order: number;
  assignedMembers: AssignedMember[];
}

export interface AssignedMember {
  userId: string;
  name: string;
  avatarUrl?: string;
}

export interface MilestoneProgress {
  projectGroupId: string;
  totalMilestones: number;
  completed: number;
  inProgress: number;
  delayed: number;
  notStarted: number;
  overdue: number;
  completionPercentage: number;
}

export interface MilestoneTimelineEntry {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  dueDate: string;
  status: string;
  isCompleted: boolean;
  completedAt?: string;
  order: number;
  assignedMembers: AssignedMember[];
}

export interface MilestoneHistoryEntry {
  id: string;
  title: string;
  completedAt: string;
  dueDate: string;
  wasOnTime: boolean;
  completedBy: string;
}

export interface MilestoneReminderDto {
  id: string;
  daysBeforeDue: number;
  reminderType: string;
  isSent: boolean;
  sentAt?: string;
}

export interface CourseMilestoneSummary {
  courseId: string;
  totalMilestones: number;
  completed: number;
  inProgress: number;
  delayed: number;
  overdue: number;
  overallCompletion: number;
  groupSummaries: GroupMilestoneSummary[];
}

export interface GroupMilestoneSummary {
  groupId: string;
  groupName: string;
  total: number;
  completed: number;
  completionPercentage: number;
}

export async function getMilestonesByGroup(groupId: string): Promise<Milestone[]> {
  const res = await api.get<{ data: Milestone[] }>(`/milestone-management/group/${groupId}`);
  return res.data.data;
}

export async function getMilestone(id: string): Promise<Milestone> {
  const res = await api.get<{ data: Milestone }>(`/milestone-management/${id}`);
  return res.data.data;
}

export async function createMilestone(data: {
  title: string;
  description?: string;
  startDate: string;
  dueDate: string;
  projectGroupId: string;
  order?: number;
  assignedUserIds?: string[];
}): Promise<Milestone> {
  const res = await api.post<{ data: Milestone }>("/milestone-management", data);
  return res.data.data;
}

export async function updateMilestone(
  id: string,
  data: {
    title?: string;
    description?: string;
    startDate?: string;
    dueDate?: string;
    status?: string;
    order?: number;
    assignedUserIds?: string[];
  }
): Promise<Milestone> {
  const res = await api.put<{ data: Milestone }>(`/milestone-management/${id}`, data);
  return res.data.data;
}

export async function deleteMilestone(id: string): Promise<void> {
  await api.delete(`/milestone-management/${id}`);
}

export async function getMilestoneProgress(projectGroupId: string): Promise<MilestoneProgress> {
  const res = await api.get<{ data: MilestoneProgress }>(`/milestone-management/progress/${projectGroupId}`);
  return res.data.data;
}

export async function getMilestoneTimeline(projectGroupId: string): Promise<MilestoneTimelineEntry[]> {
  const res = await api.get<{ data: MilestoneTimelineEntry[] }>(`/milestone-management/timeline/${projectGroupId}`);
  return res.data.data;
}

export async function getMilestoneHistory(projectGroupId: string): Promise<MilestoneHistoryEntry[]> {
  const res = await api.get<{ data: MilestoneHistoryEntry[] }>(`/milestone-management/history/${projectGroupId}`);
  return res.data.data;
}

export async function assignMilestoneMembers(milestoneId: string, userIds: string[]): Promise<void> {
  await api.post(`/milestone-management/${milestoneId}/assign`, userIds);
}

export async function completeMilestone(milestoneId: string): Promise<void> {
  await api.post(`/milestone-management/${milestoneId}/complete`);
}

export async function getMilestoneReminders(milestoneId: string): Promise<MilestoneReminderDto[]> {
  const res = await api.get<{ data: MilestoneReminderDto[] }>(`/milestone-management/${milestoneId}/reminders`);
  return res.data.data;
}

export async function generateMilestoneReminders(milestoneId: string): Promise<MilestoneReminderDto[]> {
  const res = await api.post<{ data: MilestoneReminderDto[] }>(`/milestone-management/${milestoneId}/reminders/generate`);
  return res.data.data;
}

export async function getCourseMilestoneSummary(courseId: string): Promise<CourseMilestoneSummary> {
  const res = await api.get<{ data: CourseMilestoneSummary }>(`/milestone-management/course/${courseId}/summary`);
  return res.data.data;
}
