import api from "./api";

export interface StudentSummary {
  totalContributionScore: number;
  last30DaysScore: number;
  tasksCompleted: number;
  tasksCreated: number;
  documentsEdited: number;
  filesUploaded: number;
  commentsAdded: number;
  messagesSent: number;
  totalActivities: number;
  milestonesCompleted: number;
  totalMilestones: number;
  groupsCount: number;
  averageRiskScore: number;
  highestRiskScore: number;
}

export interface GroupEntry {
  groupId: string;
  groupName: string;
  courseName: string;
  courseCode: string;
  role: string;
}

export interface ActivityTrend {
  label: string;
  score: number;
  tasksCompleted: number;
}

export interface ContributionBreakdown {
  taskCompleted: number;
  taskCreated: number;
  documentEdited: number;
  fileUploaded: number;
  commentAdded: number;
  messageSent: number;
}

export interface StudentReport {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  generatedAt: string;
  summary: StudentSummary;
  groups: GroupEntry[];
  activityTrend: ActivityTrend[];
  contributionBreakdown: ContributionBreakdown;
}

export interface GroupProgress {
  totalTasks: number;
  completedTasks: number;
  taskCompletionPercent: number;
  totalMilestones: number;
  completedMilestones: number;
  delayedMilestones: number;
  milestoneCompletionPercent: number;
}

export interface GroupMember {
  userId: string;
  fullName: string;
  avatarUrl: string;
  isLeader: boolean;
  totalScore: number;
  tasksCompleted: number;
  documentsEdited: number;
  filesUploaded: number;
  commentsAdded: number;
  messagesSent: number;
  lastActiveAt: string;
  contributionPercent: number;
}

export interface ContributionDistribution {
  name: string;
  score: number;
  percent: number;
}

export interface RiskSummary {
  riskLevel: string;
  overallScore: number;
  inactiveMembers: number;
  delayedMilestones: number;
  lowContribution: number;
  communication: number;
  taskBottleneck: number;
}

export interface GroupReport {
  projectGroupId: string;
  groupName: string;
  courseName: string;
  courseCode: string;
  leaderName: string;
  generatedAt: string;
  progress: GroupProgress;
  members: GroupMember[];
  contributionDistribution: ContributionDistribution[];
  riskSummary: RiskSummary;
  activityTrend: ActivityTrend[];
}

export interface CourseStats {
  courseId: string;
  courseName: string;
  totalGroups: number;
  totalStudents: number;
  activeStudents: number;
  participationRate: number;
  totalTasksCompleted: number;
  totalDocumentsEdited: number;
  totalMilestones: number;
  completedMilestones: number;
  delayedMilestones: number;
  milestoneCompletionRate: number;
  totalContributionScore: number;
}

export interface GroupRanking {
  projectGroupId: string;
  groupName: string;
  memberCount: number;
  totalScore: number;
  averageScore: number;
  completedMilestones: number;
  totalMilestones: number;
  milestonePercent: number;
  rank: number;
}

export interface InstructorContributionBreakdown {
  tasksCompleted: number;
  documentsEdited: number;
  filesUploaded: number;
  commentsAdded: number;
  messagesSent: number;
}

export interface InstructorReport {
  courseId: string;
  courseName: string;
  courseCode: string;
  semester: string;
  generatedAt: string;
  stats: CourseStats;
  groupRankings: GroupRanking[];
  activityTrend: ActivityTrend[];
  contributionBreakdown: InstructorContributionBreakdown;
}

export interface TopPerformer {
  userId: string;
  fullName: string;
  totalScore: number;
  tasksCompleted: number;
  groupName: string;
}

export interface SemesterSummary extends InstructorReport {
  topPerformers: TopPerformer[];
}

export async function getStudentReport(userId: string, courseId?: string): Promise<StudentReport> {
  const params = courseId ? { courseId } : {};
  const res = await api.get(`/reports/student/${userId}`, { params });
  return res.data.data;
}

export async function getGroupReport(projectGroupId: string): Promise<GroupReport> {
  const res = await api.get(`/reports/group/${projectGroupId}`);
  return res.data.data;
}

export async function getInstructorReport(courseId: string): Promise<InstructorReport> {
  const res = await api.get(`/reports/instructor/${courseId}`);
  return res.data.data;
}

export async function getSemesterSummary(courseId: string): Promise<SemesterSummary> {
  const res = await api.get(`/reports/semester/${courseId}`);
  return res.data.data;
}

export async function getGroupRankings(courseId: string): Promise<GroupRanking[]> {
  const res = await api.get(`/reports/course/${courseId}/rankings`);
  return res.data.data;
}
