import api from "./api";

export interface ContributionSummary {
  totalScore: number;
  totalActivities: number;
  activityCounts: Record<string, number>;
  weeklyScore: number;
  weeklyChange: number;
  lastActiveAt: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  score: number;
  contributionPercentage: number;
  totalActivities: number;
  lastActiveAt: string;
}

export interface WeeklyActivity {
  weekStart: string;
  weekLabel: string;
  totalScore: number;
  totalActivities: number;
  activityBreakdown: Record<string, number>;
}

export interface ActivityScore {
  activityType: string;
  count: number;
  pointsPerUnit: number;
  totalPoints: number;
}

export interface ContributionBreakdown {
  studentId: string;
  activities: ActivityScore[];
  totalScore: number;
}

export async function recordActivity(data: {
  activityType: string;
  referenceId?: string;
  workspaceId?: string;
  projectGroupId?: string;
}): Promise<void> {
  await api.post("/contribution/record", data);
}

export async function getSummary(studentId: string, projectGroupId?: string): Promise<ContributionSummary> {
  const params = projectGroupId ? { projectGroupId } : {};
  const res = await api.get<{ data: ContributionSummary }>(`/contribution/summary/${studentId}`, { params });
  return res.data.data;
}

export async function getLeaderboard(projectGroupId: string): Promise<LeaderboardEntry[]> {
  const res = await api.get<{ data: LeaderboardEntry[] }>(`/contribution/leaderboard/${projectGroupId}`);
  return res.data.data;
}

export async function getWeeklyActivity(projectGroupId: string, weeks = 4): Promise<WeeklyActivity[]> {
  const res = await api.get<{ data: WeeklyActivity[] }>(`/contribution/weekly/${projectGroupId}`, {
    params: { weeks },
  });
  return res.data.data;
}

export async function getBreakdown(studentId: string, projectGroupId?: string): Promise<ContributionBreakdown> {
  const params = projectGroupId ? { projectGroupId } : {};
  const res = await api.get<{ data: ContributionBreakdown }>(`/contribution/breakdown/${studentId}`, { params });
  return res.data.data;
}

export async function getTopContributors(projectGroupId: string, limit = 3): Promise<LeaderboardEntry[]> {
  const res = await api.get<{ data: LeaderboardEntry[] }>(`/contribution/leaderboard/group/${projectGroupId}/top`, {
    params: { limit },
  });
  return res.data.data;
}
