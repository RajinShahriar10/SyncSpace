"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportStore } from "@/features/reports/stores/reportStore";
import {
  ArrowLeft,
  Users,
  BookOpen,
  Target,
  TrendingUp,
  Activity,
  BarChart3,
  Printer,
  FileSpreadsheet,
  Trophy,
  Clock,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { exportToPDF, exportToExcel } from "@/lib/export";

const COLORS = {
  primary: "#6366f1",
  secondary: "#8B5CF6",
  accent: "#06B6D4",
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#F43F5E",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.emerald,
  COLORS.amber,
];

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function InstructorReportPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const { fetchInstructorReport, instructorReport, isLoading } = useReportStore();

  useEffect(() => {
    if (courseId) {
      fetchInstructorReport(courseId);
    }
  }, [courseId, fetchInstructorReport]);

  const handlePrint = () => {
    exportToPDF("printable-report", "Instructor Report");
  };

  const handleExportExcel = () => {
    if (!instructorReport) return;

    const rankingsData = instructorReport.groupRankings.map((g) => ({
      Rank: g.rank,
      "Group Name": g.groupName,
      Members: g.memberCount,
      "Total Score": g.totalScore,
      "Avg Score": g.averageScore,
      "Milestones Completed": g.completedMilestones,
      "Total Milestones": g.totalMilestones,
      "Milestone %": g.milestonePercent,
    }));

    const statsData = [
      { Field: "Course Name", Value: instructorReport.courseName },
      { Field: "Course Code", Value: instructorReport.courseCode },
      { Field: "Semester", Value: instructorReport.semester },
      { Field: "Total Students", Value: instructorReport.stats.totalStudents },
      { Field: "Active Students", Value: instructorReport.stats.activeStudents },
      { Field: "Participation Rate", Value: `${instructorReport.stats.participationRate}%` },
      { Field: "Total Groups", Value: instructorReport.stats.totalGroups },
      { Field: "Completed Milestones", Value: instructorReport.stats.completedMilestones },
      { Field: "Total Milestones", Value: instructorReport.stats.totalMilestones },
      { Field: "Tasks Completed", Value: instructorReport.stats.totalTasksCompleted },
      { Field: "Documents Edited", Value: instructorReport.stats.totalDocumentsEdited },
      { Field: "Total Contribution Score", Value: instructorReport.stats.totalContributionScore },
    ];

    exportToExcel(rankingsData, `${instructorReport.courseCode}_Group_Rankings`, "Group Rankings");
    exportToExcel(statsData, `${instructorReport.courseCode}_Course_Stats`, "Course Stats");
  };

  if (isLoading || !instructorReport) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
            <p className="text-sm text-zinc-500">Loading instructor report…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const report = instructorReport;
  const { stats } = report;

  const contributionPieData = [
    { name: "Tasks", value: report.contributionBreakdown.tasksCompleted },
    { name: "Documents", value: report.contributionBreakdown.documentsEdited },
    { name: "Files", value: report.contributionBreakdown.filesUploaded },
    { name: "Comments", value: report.contributionBreakdown.commentsAdded },
    { name: "Messages", value: report.contributionBreakdown.messagesSent },
  ];

  const participationRate = stats.participationRate;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (participationRate / 100) * circumference;

  return (
    <DashboardLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="mx-auto max-w-6xl space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeIn} className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/reports")}
              className="text-zinc-400 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {report.courseName}
              </h1>
              <p className="text-sm text-zinc-500">
                {report.courseCode} · {report.semester}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-zinc-800 text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="border-zinc-800 text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </motion.div>

        {/* Printable Report */}
        <div id="printable-report" className="space-y-6">
          {/* Course Info Header */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="flex items-center gap-5 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8B5CF6] text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
                  <BookOpen className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    {report.courseName}
                  </h2>
                  <p className="text-sm text-zinc-400">
                    {report.courseCode} · {report.semester}
                  </p>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <p>Report Generated</p>
                  <p className="text-zinc-400">
                    {new Date(report.generatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Course Stats Grid */}
          <motion.div variants={fadeIn} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">Total Students</p>
                  <Users className="h-4 w-4 text-[#6366f1]" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {stats.totalStudents}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                  <BookOpen className="h-3 w-3" />
                  <span>Enrolled in course</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">Active Students</p>
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {stats.activeStudents}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stats.participationRate}% participation</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">Total Groups</p>
                  <BarChart3 className="h-4 w-4 text-[#8B5CF6]" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {stats.totalGroups}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                  <Users className="h-3 w-3" />
                  <span>Project teams</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">Milestones Completed</p>
                  <Target className="h-4 w-4 text-[#F59E0B]" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {stats.completedMilestones}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />
                  <span>of {stats.totalMilestones} total</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Group Rankings Table */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Trophy className="h-4 w-4 text-[#F59E0B]" />
                  Group Rankings
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  {report.groupRankings.length} group{report.groupRankings.length !== 1 ? "s" : ""} ranked by total score
                </p>
              </CardHeader>
              <CardContent>
                {report.groupRankings.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500">
                    No group rankings available.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="pb-3 text-left font-medium text-zinc-400">Rank</th>
                          <th className="pb-3 text-left font-medium text-zinc-400">Group Name</th>
                          <th className="pb-3 text-right font-medium text-zinc-400">Members</th>
                          <th className="pb-3 text-right font-medium text-zinc-400">Total Score</th>
                          <th className="pb-3 text-right font-medium text-zinc-400">Avg Score</th>
                          <th className="pb-3 text-right font-medium text-zinc-400">Milestones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {report.groupRankings.map((group) => (
                          <tr key={group.projectGroupId} className="hover:bg-white/[0.02]">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                {group.rank <= 3 ? (
                                  <Trophy
                                    className="h-4 w-4"
                                    style={{ color: MEDAL_COLORS[group.rank - 1] }}
                                  />
                                ) : (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-zinc-400">
                                    {group.rank}
                                  </span>
                                )}
                                {group.rank <= 3 && (
                                  <span
                                    className="text-sm font-medium"
                                    style={{ color: MEDAL_COLORS[group.rank - 1] }}
                                  >
                                    #{group.rank}
                                  </span>
                                )}
                                {group.rank > 3 && (
                                  <span className="text-sm font-medium text-zinc-400">
                                    #{group.rank}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-zinc-200 font-medium">
                              {group.groupName}
                            </td>
                            <td className="py-3 text-right text-zinc-300">
                              {group.memberCount}
                            </td>
                            <td className="py-3 text-right font-medium text-white">
                              {group.totalScore.toLocaleString()}
                            </td>
                            <td className="py-3 text-right text-zinc-300">
                              {group.averageScore.toLocaleString()}
                            </td>
                            <td className="py-3 text-right">
                              <span className="text-white font-medium">
                                {group.completedMilestones}
                              </span>
                              <span className="text-zinc-500">
                                /{group.totalMilestones}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Activity Trend */}
            <motion.div variants={fadeIn}>
              <Card className="border-zinc-800/60 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-white">
                    <Activity className="h-4 w-4 text-[#06B6D4]" />
                    Activity Trend
                  </CardTitle>
                  <p className="text-xs text-zinc-500">
                    Course-wide weekly activity over time
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={report.activityTrend}>
                        <defs>
                          <linearGradient id="instructorActivityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: "#71717a" }}
                          axisLine={{ stroke: "#27272a" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#71717a" }}
                          axisLine={{ stroke: "#27272a" }}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #27272a",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: "#fafafa",
                          }}
                          labelStyle={{ color: "#a1a1aa" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          fill="url(#instructorActivityGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contribution Breakdown */}
            <motion.div variants={fadeIn}>
              <Card className="border-zinc-800/60 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-white">
                    <BarChart3 className="h-4 w-4 text-[#8B5CF6]" />
                    Contribution Breakdown
                  </CardTitle>
                  <p className="text-xs text-zinc-500">
                    Distribution of course-wide activity types
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="h-64 w-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={contributionPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {contributionPieData.map((_entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#18181b",
                              border: "1px solid #27272a",
                              borderRadius: "8px",
                              fontSize: "12px",
                              color: "#fafafa",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3">
                      {contributionPieData.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                              }}
                            />
                            <span className="text-sm text-zinc-300">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium text-white">
                            {item.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Participation Analytics */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Users className="h-4 w-4 text-emerald-400" />
                  Participation Analytics
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  Overall student engagement across the course
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-8 py-4 sm:flex-row sm:justify-center sm:gap-16">
                  {/* Circular Participation Display */}
                  <div className="relative flex items-center justify-center">
                    <svg width="140" height="140" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="#27272a"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke={COLORS.emerald}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 60 60)"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-bold text-white">
                        {participationRate}%
                      </span>
                      <span className="text-xs text-zinc-500">Participation</span>
                    </div>
                  </div>

                  {/* Stats breakdown */}
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
                      <p className="text-xs text-zinc-500 mt-1">Enrolled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-400">{stats.activeStudents}</p>
                      <p className="text-xs text-zinc-500 mt-1">Active</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-zinc-400">
                        {stats.totalStudents - stats.activeStudents}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">Inactive</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{stats.totalGroups}</p>
                      <p className="text-xs text-zinc-500 mt-1">Groups</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#F59E0B]">
                        {stats.completedMilestones}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">Milestones Done</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-zinc-400">
                        {stats.totalContributionScore.toLocaleString()}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">Total Score</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
