import api from "./api";

export interface RiskDashboard {
  totalGroups: number;
  highRiskGroups: number;
  mediumRiskGroups: number;
  lowRiskGroups: number;
  unassessedGroups: number;
  totalAlerts: number;
  highSeverityAlerts: number;
  mediumSeverityAlerts: number;
  lowSeverityAlerts: number;
  totalMilestones: number;
  delayedMilestones: number;
  overallHealth: number;
}

export interface RiskAssessment {
  id: string;
  projectGroupId: string;
  groupName: string;
  courseName?: string;
  riskLevel: "Low" | "Medium" | "High";
  overallScore: number;
  factorScores: FactorScores;
  memberCount: number;
  inactiveMemberCount: number;
  delayedMilestoneCount: number;
  totalMilestones: number;
  assessedAt: string;
  alertCount: number;
}

export interface FactorScores {
  inactiveMembers: number;
  delayedMilestones: number;
  lowContribution: number;
  communication: number;
  taskBottleneck: number;
}

export interface RiskAlert {
  id: string;
  projectGroupId: string;
  groupName?: string;
  courseName?: string;
  factor: string;
  severity: "Low" | "Medium" | "High";
  title: string;
  message: string;
  recommendation?: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface GroupRiskDetail {
  assessment: RiskAssessment;
  members: GroupMemberRisk[];
  milestones: MilestoneRisk[];
  totalTasks: number;
}

export interface GroupMemberRisk {
  userId: string;
  name: string;
  avatarUrl?: string;
  totalContributions: number;
  lastActivityAt?: string;
  isInactive: boolean;
  daysSinceActivity: number;
}

export interface MilestoneRisk {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  isCompleted: boolean;
  isOverdue: boolean;
  daysOverdue: number;
}

export async function getRiskDashboard(courseId?: string): Promise<RiskDashboard> {
  const params = courseId ? `?courseId=${courseId}` : "";
  const res = await api.get<{ data: RiskDashboard }>(`/risk/dashboard${params}`);
  return res.data.data;
}

export async function getRiskAssessments(courseId?: string, riskLevel?: string): Promise<RiskAssessment[]> {
  const params = new URLSearchParams();
  if (courseId) params.set("courseId", courseId);
  if (riskLevel) params.set("riskLevel", riskLevel);
  const qs = params.toString();
  const res = await api.get<{ data: RiskAssessment[] }>(`/risk/assessments${qs ? `?${qs}` : ""}`);
  return res.data.data;
}

export async function assessGroup(projectGroupId: string): Promise<RiskAssessment> {
  const res = await api.post<{ data: RiskAssessment }>(`/risk/assess/${projectGroupId}`);
  return res.data.data;
}

export async function getRiskAlerts(courseId?: string, severity?: string, acknowledged?: boolean): Promise<RiskAlert[]> {
  const params = new URLSearchParams();
  if (courseId) params.set("courseId", courseId);
  if (severity) params.set("severity", severity);
  if (acknowledged !== undefined) params.set("acknowledged", String(acknowledged));
  const qs = params.toString();
  const res = await api.get<{ data: RiskAlert[] }>(`/risk/alerts${qs ? `?${qs}` : ""}`);
  return res.data.data;
}

export async function acknowledgeAlert(alertId: string, userId: string): Promise<void> {
  await api.post(`/risk/alerts/${alertId}/acknowledge?userId=${userId}`);
}

export async function getGroupRiskDetail(projectGroupId: string): Promise<GroupRiskDetail> {
  const res = await api.get<{ data: GroupRiskDetail }>(`/risk/group/${projectGroupId}`);
  return res.data.data;
}

export async function getAutoRefresh(since?: string): Promise<{ timestamp: string; assessments: { projectGroupId: string; groupName: string; riskLevel: string; score: number; newAlerts: number }[] }> {
  const params = since ? `?since=${since}` : "";
  const res = await api.get(`/risk/auto-refresh${params}`);
  return res.data.data;
}
