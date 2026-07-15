import api from "./api";

export interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  groupId: string;
}

export interface CourseOverview {
  courseId: string;
  courseName: string;
  courseCode: string;
  totalGroups: number;
  activeGroups: number;
  atRiskGroups: number;
  upcomingDeadlines: DeadlineItem[];
}

export interface GroupMemberInfo {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export interface GroupMonitoring {
  groupId: string;
  groupName: string;
  progress: number;
  activeMembers: number;
  totalMembers: number;
  pendingTasks: number;
  completedTasks: number;
  totalTasks: number;
  completedMilestones: number;
  totalMilestones: number;
  lastActivityAt: string;
  members: GroupMemberInfo[];
}

export interface GroupHealthScoreData {
  groupId: string;
  groupName: string;
  totalScore: number;
  category: string;
  taskCompletionScore: number;
  activityFrequencyScore: number;
  deadlineComplianceScore: number;
  totalTasks: number;
  completedTasks: number;
  recentActivities: number;
  overdueMilestones: number;
  totalMilestones: number;
}

export interface ActivityBreakdown {
  activityType: string;
  count: number;
  totalScore: number;
}

export interface StudentContribution {
  studentId: string;
  studentName: string;
  totalScore: number;
  activityCount: number;
  breakdown: Record<string, number>;
}

export interface ContributionMonitoringData {
  courseId: string;
  totalActivities: number;
  totalScore: number;
  activityBreakdown: ActivityBreakdown[];
  studentContributions: StudentContribution[];
}

export interface ActivityTimelineEntry {
  id: string;
  studentName: string;
  activityType: string;
  score: number;
  timestamp: string;
  projectGroupId: string | null;
}

export interface ParticipationHeatmapEntry {
  date: string;
  dayLabel: string;
  activityCount: number;
  totalScore: number;
}

export async function getCourseOverview(courseId: string): Promise<CourseOverview> {
  const res = await api.get<{ data: CourseOverview }>(`/instructordashboard/course/${courseId}/overview`);
  return res.data.data;
}

export async function getGroupMonitoring(courseId: string): Promise<GroupMonitoring[]> {
  const res = await api.get<{ data: GroupMonitoring[] }>(`/instructordashboard/course/${courseId}/groups`);
  return res.data.data;
}

export async function getGroupHealthScore(groupId: string): Promise<GroupHealthScoreData> {
  const res = await api.get<{ data: GroupHealthScoreData }>(`/instructordashboard/group/${groupId}/health`);
  return res.data.data;
}

export async function getContributionMonitoring(courseId: string): Promise<ContributionMonitoringData> {
  const res = await api.get<{ data: ContributionMonitoringData }>(`/instructordashboard/course/${courseId}/contributions`);
  return res.data.data;
}

export async function getActivityTimeline(courseId: string, days = 30): Promise<ActivityTimelineEntry[]> {
  const res = await api.get<{ data: ActivityTimelineEntry[] }>(`/instructordashboard/course/${courseId}/timeline`, {
    params: { days },
  });
  return res.data.data;
}

export async function getParticipationHeatmap(courseId: string): Promise<ParticipationHeatmapEntry[]> {
  const res = await api.get<{ data: ParticipationHeatmapEntry[] }>(`/instructordashboard/course/${courseId}/heatmap`);
  return res.data.data;
}
