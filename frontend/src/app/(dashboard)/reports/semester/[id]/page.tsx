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
  Trophy,
  Calendar,
  Download,
  Printer,
  Medal,
  Star,
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

export default function SemesterSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const { fetchSemesterSummary, semesterSummary, isLoading } = useReportStore();

  useEffect(() => {
    if (courseId) {
      fetchSemesterSummary(courseId);
    }
  }, [courseId, fetchSemesterSummary]);

  const handlePrint = () => {
    exportToPDF("printable-report", "Semester Summary Report");
  };

  const handleExportExcel = () => {
    if (!semesterSummary) return;

    const overviewData = [
      { Field: "Course Name", Value: semesterSummary.courseName },
      { Field: "Course Code", Value: semesterSummary.courseCode },
      { Field: "Semester", Value: semesterSummary.semester },
      { Field: "Total Students", Value: semesterSummary.stats.totalStudents },
      { Field: "Active Students", Value: semesterSummary.stats.activeStudents },
      { Field: "Participation Rate", Value: `${semesterSummary.stats.participationRate}%` },
      { Field: "Total Groups", Value: semesterSummary.stats.totalGroups },
      { Field: "Completed Milestones", Value: semesterSummary.stats.completedMilestones },
      { Field: "Total Milestones", Value: semesterSummary.stats.totalMilestones },
      { Field: "Milestone Completion Rate", Value: `${semesterSummary.stats.milestoneCompletionRate}%` },
      { Field: "Tasks Completed", Value: semesterSummary.stats.totalTasksCompleted },
      { Field: "Documents Edited", Value: semesterSummary.stats.totalDocumentsEdited },
      { Field: "Total Contribution Score", Value: semesterSummary.stats.totalContributionScore },
    ];

    const topPerformersData = (semesterSummary.topPerformers || []).map((p, i) => ({
      Rank: i + 1,
      Name: p.fullName,
      "Total Score": p.totalScore,
      "Tasks Completed": p.tasksCompleted,
      Group: p.groupName,
    }));

    const groupRankingsData = (semesterSummary.groupRankings || []).map((g) => ({
      Rank: g.rank,
      "Group Name": g.groupName,
      Members: g.memberCount,
      "Total Score": g.totalScore,
      "Avg Score": g.averageScore,
      "Milestones Completed": g.completedMilestones,
      "Total Milestones": g.totalMilestones,
      "Milestone %": g.milestonePercent,
    }));

    const activityData = (semesterSummary.activityTrend || []).map((a) => ({
      Week: a.label,
      Activity: a.score,
    }));

    const contributionData = [
      { Type: "Tasks", Count: (semesterSummary.contributionBreakdown || {}).tasksCompleted },
      { Type: "Documents", Count: (semesterSummary.contributionBreakdown || {}).documentsEdited },
      { Type: "Files", Count: (semesterSummary.contributionBreakdown || {}).filesUploaded },
      { Type: "Comments", Count: (semesterSummary.contributionBreakdown || {}).commentsAdded },
      { Type: "Messages", Count: (semesterSummary.contributionBreakdown || {}).messagesSent },
    ];

    const wb = require("xlsx");
    const workbook = wb.utils.book_new();

    const wsOverview = wb.utils.json_to_sheet(overviewData);
    const wsPerformers = wb.utils.json_to_sheet(topPerformersData);
    const wsGroups = wb.utils.json_to_sheet(groupRankingsData);
    const wsActivity = wb.utils.json_to_sheet(activityData);
    const wsContribution = wb.utils.json_to_sheet(contributionData);

    wb.utils.book_append_sheet(workbook, wsOverview, "Course Overview");
    wb.utils.book_append_sheet(workbook, wsPerformers, "Top Performers");
    wb.utils.book_append_sheet(workbook, wsGroups, "Group Rankings");
    wb.utils.book_append_sheet(workbook, wsActivity, "Activity Trend");
    wb.utils.book_append_sheet(workbook, wsContribution, "Contributions");

    wb.writeFile(workbook, `${semesterSummary.courseCode}_Semester_Summary.xlsx`);
  };

  if (isLoading || !semesterSummary) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
            <p className="text-sm text-zinc-500">Loading semester summary…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const report = semesterSummary;
  const { stats } = report;

  const contributionPieData = [
    { name: "Tasks", value: (report.contributionBreakdown || {}).tasksCompleted },
    { name: "Documents", value: (report.contributionBreakdown || {}).documentsEdited },
    { name: "Files", value: (report.contributionBreakdown || {}).filesUploaded },
    { name: "Comments", value: (report.contributionBreakdown || {}).commentsAdded },
    { name: "Messages", value: (report.contributionBreakdown || {}).messagesSent },
  ];

  const top3 = (report.topPerformers || []).slice(0, 3);
  const restPerformers = (report.topPerformers || []).slice(3);

  const milestoneCompletionRate = stats.totalMilestones > 0
    ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100)
    : 0;

  const performanceRanges = [
    { range: "0 – 10", min: 0, max: 10, color: COLORS.rose },
    { range: "10 – 20", min: 10, max: 20, color: COLORS.amber },
    { range: "20 – 50", min: 20, max: 50, color: COLORS.secondary },
    { range: "50+", min: 50, max: Infinity, color: COLORS.emerald },
  ];

  const performanceDistribution = performanceRanges.map((r) => ({
    range: r.range,
    count: (report.topPerformers || []).filter(
      (p) => p.totalScore >= r.min && p.totalScore < r.max
    ).length + (r.max === Infinity
      ? 0
      : 0),
    color: r.color,
  }));

  const allStudentScores = (report.groupRankings || []).reduce(
    (acc, g) => acc + g.memberCount,
    0
  );

  const distributionData = performanceRanges.map((r) => ({
    range: r.range,
    count:
      r.max === Infinity
        ? Math.max(0, stats.totalStudents - performanceRanges.slice(0, -1).reduce(
            (sum, pr) =>
              sum +
              (report.topPerformers || []).filter(
                (p) => p.totalScore >= pr.min && p.totalScore < pr.max
              ).length,
            0
          ))
        : (report.topPerformers || []).filter(
            (p) => p.totalScore >= r.min && p.totalScore < r.max
          ).length,
    color: r.color,
  }));

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
                Semester Summary · {report.courseCode} · {report.semester}
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
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Printable Report */}
        <div id="printable-report" className="space-y-6">
          {/* Semester Info Header */}
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

          {/* Course Stats Overview */}
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
                  <TrendingUp className="h-3 w-3" />
                  <span>{stats.activeStudents} active</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">Total Groups</p>
                  <Trophy className="h-4 w-4 text-[#8B5CF6]" />
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
                  <p className="text-sm font-medium text-zinc-400">Total Milestones</p>
                  <Target className="h-4 w-4 text-[#10B981]" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {stats.totalMilestones}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                  <Calendar className="h-3 w-3" />
                  <span>{stats.completedMilestones} completed</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">Completion Rate</p>
                  <Star className="h-4 w-4 text-[#F59E0B]" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {milestoneCompletionRate}%
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                  <Medal className="h-3 w-3" />
                  <span>Milestone completion</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Performers Podium */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Trophy className="h-4 w-4 text-[#F59E0B]" />
                  Top Performers
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  Highest scoring students across the semester
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Podium Display */}
                {top3.length > 0 && (
                  <div className="flex items-end justify-center gap-4 pt-4">
                    {/* 2nd Place */}
                    {top3[1] && (
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                          style={{
                            backgroundColor: "#C0C0C0",
                            color: "#1a1a1a",
                          }}
                        >
                          2
                        </div>
                        <p className="max-w-[100px] truncate text-center text-xs font-medium text-zinc-200">
                          {top3[1].fullName.split(" ")[0]}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {top3[1].totalScore.toLocaleString()}
                        </p>
                        <div
                          className="flex w-28 items-center justify-center rounded-t-lg py-4 text-sm font-bold text-zinc-900"
                          style={{ backgroundColor: "#C0C0C0", minHeight: "56px" }}
                        >
                          #2
                        </div>
                      </div>
                    )}

                    {/* 1st Place */}
                    {top3[0] && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="mb-1">
                          <Medal className="h-6 w-6 text-[#FFD700]" />
                        </div>
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold shadow-lg"
                          style={{
                            backgroundColor: "#FFD700",
                            color: "#1a1a1a",
                            boxShadow: "0 0 20px rgba(255,215,0,0.3)",
                          }}
                        >
                          1
                        </div>
                        <p className="max-w-[100px] truncate text-center text-xs font-medium text-zinc-200">
                          {top3[0].fullName.split(" ")[0]}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {top3[0].totalScore.toLocaleString()}
                        </p>
                        <div
                          className="flex w-28 items-center justify-center rounded-t-lg py-6 text-sm font-bold text-zinc-900"
                          style={{ backgroundColor: "#FFD700", minHeight: "72px" }}
                        >
                          #1
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {top3[2] && (
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: "#CD7F32",
                            color: "#1a1a1a",
                          }}
                        >
                          3
                        </div>
                        <p className="max-w-[100px] truncate text-center text-xs font-medium text-zinc-200">
                          {top3[2].fullName.split(" ")[0]}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {top3[2].totalScore.toLocaleString()}
                        </p>
                        <div
                          className="flex w-28 items-center justify-center rounded-t-lg py-3 text-sm font-bold text-zinc-900"
                          style={{ backgroundColor: "#CD7F32", minHeight: "44px" }}
                        >
                          #3
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Full Performers Table */}
                {(report.topPerformers || []).length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="pb-3 text-left font-medium text-zinc-400">Rank</th>
                          <th className="pb-3 text-left font-medium text-zinc-400">Student</th>
                          <th className="pb-3 text-left font-medium text-zinc-400">Group</th>
                          <th className="pb-3 text-right font-medium text-zinc-400">Score</th>
                          <th className="pb-3 text-right font-medium text-zinc-400">Tasks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {(report.topPerformers || []).map((performer, index) => (
                          <tr key={performer.userId} className="hover:bg-white/[0.02]">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                {index < 3 ? (
                                  <Trophy
                                    className="h-4 w-4"
                                    style={{ color: MEDAL_COLORS[index] }}
                                  />
                                ) : (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-zinc-400">
                                    {index + 1}
                                  </span>
                                )}
                                <span
                                  className="text-sm font-medium"
                                  style={{
                                    color: index < 3 ? MEDAL_COLORS[index] : undefined,
                                  }}
                                >
                                  #{index + 1}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-zinc-200 font-medium">
                              {performer.fullName}
                            </td>
                            <td className="py-3 text-zinc-400">
                              {performer.groupName}
                            </td>
                            <td className="py-3 text-right font-medium text-white">
                              {performer.totalScore.toLocaleString()}
                            </td>
                            <td className="py-3 text-right text-zinc-300">
                              {performer.tasksCompleted}
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

          {/* Group Rankings */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Trophy className="h-4 w-4 text-[#8B5CF6]" />
                  Group Rankings
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  {(report.groupRankings || []).length} group{(report.groupRankings || []).length !== 1 ? "s" : ""} ranked by total score
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {(report.groupRankings || []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500">
                    No group rankings available.
                  </p>
                ) : (
                  <>
                    {/* Bar Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(report.groupRankings || [])}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis
                            dataKey="groupName"
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
                            cursor={{ fill: "rgba(255,255,255,0.03)" }}
                          />
                          <Bar dataKey="totalScore" name="Total Score" radius={[4, 4, 0, 0]}>
                            {(report.groupRankings || []).map((_entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Rankings Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="pb-3 text-left font-medium text-zinc-400">Rank</th>
                            <th className="pb-3 text-left font-medium text-zinc-400">Group Name</th>
                            <th className="pb-3 text-right font-medium text-zinc-400">Members</th>
                            <th className="pb-3 text-right font-medium text-zinc-400">Total Score</th>
                            <th className="pb-3 text-right font-medium text-zinc-400">Avg Score</th>
                            <th className="pb-3 text-right font-medium text-zinc-400">Milestone %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {(report.groupRankings || []).map((group) => (
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
                                  <span
                                    className="text-sm font-medium"
                                    style={{
                                      color: group.rank <= 3 ? MEDAL_COLORS[group.rank - 1] : undefined,
                                    }}
                                  >
                                    #{group.rank}
                                  </span>
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
                                  {group.milestonePercent}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
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
                    <TrendingUp className="h-4 w-4 text-[#06B6D4]" />
                    Activity Trend
                  </CardTitle>
                  <p className="text-xs text-zinc-500">
                    Course-wide weekly activity over time
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(report.activityTrend || [])}>
                        <defs>
                          <linearGradient id="semesterActivityGradient" x1="0" y1="0" x2="0" y2="1">
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
                          fill="url(#semesterActivityGradient)"
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
                    <Medal className="h-4 w-4 text-[#8B5CF6]" />
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

          {/* Performance Distribution */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Star className="h-4 w-4 text-[#F59E0B]" />
                  Performance Distribution
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  How many students scored in each range
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {performanceRanges.map((range) => {
                    const count = range.max === Infinity
                      ? stats.totalStudents - performanceRanges.slice(0, -1).reduce(
                          (sum, pr) =>
                            sum +
                            (report.topPerformers || []).filter(
                              (p) => p.totalScore >= pr.min && p.totalScore < pr.max
                            ).length,
                          0
                        )
                      : (report.topPerformers || []).filter(
                          (p) => p.totalScore >= range.min && p.totalScore < range.max
                        ).length;

                    const percentage = stats.totalStudents > 0
                      ? Math.round((count / stats.totalStudents) * 100)
                      : 0;

                    return (
                      <div
                        key={range.range}
                        className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-4 text-center"
                      >
                        <p
                          className="text-3xl font-bold"
                          style={{ color: range.color }}
                        >
                          {count}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Score {range.range}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {percentage}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
