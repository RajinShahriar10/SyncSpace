"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  CheckCircle2,
  Activity,
  FileText,
  Upload,
  Users,
  BarChart3,
  Calendar,
  Printer,
  FileSpreadsheet,
  FileDown,
  Shield,
  Trophy,
  BookOpen,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportStore } from "@/features/reports/stores/reportStore";
import { exportToPDF, exportStudentReportToExcel } from "@/lib/export";

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const COLORS = {
  primary: "#6366f1",
  emerald: "#10B981",
  cyan: "#06B6D4",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  rose: "#F43F5E",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.emerald,
  COLORS.cyan,
  COLORS.amber,
  COLORS.purple,
  COLORS.rose,
];

export default function StudentReportPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const { fetchStudentReport, studentReport, isLoading } = useReportStore();

  useEffect(() => {
    if (userId) {
      fetchStudentReport(userId);
    }
  }, [userId, fetchStudentReport]);

  const handlePrint = () => {
    exportToPDF("printable-report", "Student Report");
  };

  const handleExportExcel = () => {
    if (studentReport) {
      exportStudentReportToExcel(studentReport);
    }
  };

  const handleExportCSV = () => {
    if (!studentReport) return;

    const rows = [
      ["Metric", "Value"],
      ["Total Score", String(studentReport.summary.totalContributionScore)],
      ["Tasks Completed", String(studentReport.summary.tasksCompleted)],
      ["Documents Edited", String(studentReport.summary.documentsEdited)],
      ["Files Uploaded", String(studentReport.summary.filesUploaded)],
      ["Comments Added", String(studentReport.summary.commentsAdded)],
      ["Messages Sent", String(studentReport.summary.messagesSent)],
      ["Groups Joined", String(studentReport.summary.groupsCount)],
      ["Milestones Completed", String(studentReport.summary.milestonesCompleted)],
      ["Total Activities", String(studentReport.summary.totalActivities)],
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-report-${userId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !studentReport) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
            <p className="text-sm text-zinc-500">Loading student report…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const report = studentReport;
  const summary = report.summary;

  const activityData = report.activityTrend.map((a) => ({
    week: a.label,
    score: a.score,
    tasks: a.tasksCompleted,
  }));

  const breakdownData = [
    { name: "Tasks Completed", value: report.contributionBreakdown.taskCompleted },
    { name: "Tasks Created", value: report.contributionBreakdown.taskCreated },
    { name: "Documents Edited", value: report.contributionBreakdown.documentEdited },
    { name: "Files Uploaded", value: report.contributionBreakdown.fileUploaded },
    { name: "Comments Added", value: report.contributionBreakdown.commentAdded },
    { name: "Messages Sent", value: report.contributionBreakdown.messageSent },
  ].filter((d) => d.value > 0);

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
                Student Report
              </h1>
              <p className="text-sm text-zinc-500">
                Detailed performance analytics for {report.fullName}
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-zinc-800 text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        {/* Printable Report */}
        <div id="printable-report" className="space-y-6">
          {/* Student Info Header */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="flex items-center gap-5 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8B5CF6] text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
                  {report.fullName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    {report.fullName}
                  </h2>
                  <p className="text-sm text-zinc-400">{report.email}</p>
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

          {/* Summary Stats Grid */}
          <motion.div variants={fadeIn} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">Total Score</p>
                  <Target className="h-4 w-4 text-[#6366f1]" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {summary.totalContributionScore.toLocaleString()}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>{summary.last30DaysScore.toLocaleString()} last 30 days</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">Tasks Completed</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {summary.tasksCompleted}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                  <Activity className="h-3 w-3" />
                  <span>{summary.tasksCreated} created</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">Documents Edited</p>
                  <FileText className="h-4 w-4 text-[#06B6D4]" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {summary.documentsEdited}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                  <FileText className="h-3 w-3" />
                  <span>{summary.filesUploaded} files uploaded</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">Groups</p>
                  <Users className="h-4 w-4 text-[#F59E0B]" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {summary.groupsCount}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                  <Trophy className="h-3 w-3" />
                  <span>{summary.milestonesCompleted}/{summary.totalMilestones} milestones</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Activity Trend Chart */}
            <motion.div variants={fadeIn}>
              <Card className="border-zinc-800/60 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-white">
                    <BarChart3 className="h-4 w-4 text-[#6366f1]" />
                    Activity Trend
                  </CardTitle>
                  <p className="text-xs text-zinc-500">
                    Weekly score progression over the last 12 weeks
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData}>
                        <defs>
                          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis
                          dataKey="week"
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
                          dataKey="score"
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          fill="url(#scoreGradient)"
                        />
                        <Area
                          type="monotone"
                          dataKey="tasks"
                          stroke={COLORS.emerald}
                          strokeWidth={1.5}
                          fill="url(#taskGradient)"
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
                    <Activity className="h-4 w-4 text-[#8B5CF6]" />
                    Contribution Breakdown
                  </CardTitle>
                  <p className="text-xs text-zinc-500">
                    Distribution of activity types
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="h-64 w-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={breakdownData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {breakdownData.map(
                              (_entry: { name: string; value: number }, index: number) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              )
                            )}
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
                      {breakdownData.map(
                        (item: { name: string; value: number }, index: number) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    PIE_COLORS[index % PIE_COLORS.length],
                                }}
                              />
                              <span className="text-sm text-zinc-300">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-white">
                              {item.value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Detailed Metrics Table */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <FileText className="h-4 w-4 text-[#06B6D4]" />
                  Detailed Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="pb-3 text-left font-medium text-zinc-400">
                          Metric
                        </th>
                        <th className="pb-3 text-right font-medium text-zinc-400">
                          Value
                        </th>
                        <th className="pb-3 text-right font-medium text-zinc-400">
                          Category
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {[
                        { metric: "Total Score", value: summary.totalContributionScore.toLocaleString(), category: "Performance" },
                        { metric: "Tasks Completed", value: String(summary.tasksCompleted), category: "Productivity" },
                        { metric: "Tasks Created", value: String(summary.tasksCreated), category: "Productivity" },
                        { metric: "Documents Edited", value: String(summary.documentsEdited), category: "Collaboration" },
                        { metric: "Files Uploaded", value: String(summary.filesUploaded), category: "Resources" },
                        { metric: "Comments Added", value: String(summary.commentsAdded), category: "Engagement" },
                        { metric: "Messages Sent", value: String(summary.messagesSent), category: "Communication" },
                        { metric: "Total Activities", value: String(summary.totalActivities), category: "Overall" },
                        { metric: "Groups Joined", value: String(summary.groupsCount), category: "Collaboration" },
                        { metric: "Milestones Completed", value: `${summary.milestonesCompleted}/${summary.totalMilestones}`, category: "Progress" },
                      ].map((row) => (
                        <tr key={row.metric} className="hover:bg-white/[0.02]">
                          <td className="py-3 text-zinc-200">{row.metric}</td>
                          <td className="py-3 text-right font-medium text-white">
                            {row.value}
                          </td>
                          <td className="py-3 text-right">
                            <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">
                              {row.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Groups Section */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Users className="h-4 w-4 text-[#F59E0B]" />
                  Group Memberships
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  {report.groups.length} group{report.groups.length !== 1 ? "s" : ""} joined
                </p>
              </CardHeader>
              <CardContent>
                {report.groups.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500">
                    No group memberships found.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {report.groups.map((group) => (
                      <div
                        key={group.groupId}
                        className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white">{group.groupName}</h4>
                          <span className="inline-flex items-center rounded-full bg-[#6366f1]/10 px-2.5 py-0.5 text-xs font-medium text-[#6366f1]">
                            {group.role}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {group.courseName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Risk Assessment */}
          {(summary.averageRiskScore > 0 || summary.highestRiskScore > 0) && (
            <motion.div variants={fadeIn}>
              <Card className="border-zinc-800/60 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-white">
                    <Shield className="h-4 w-4 text-[#F43F5E]" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-4">
                      <p className="text-sm text-zinc-400">Average Risk Score</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {summary.averageRiskScore}
                      </p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(summary.averageRiskScore, 100)}%`,
                            backgroundColor:
                              summary.averageRiskScore > 60
                                ? "#F43F5E"
                                : summary.averageRiskScore > 30
                                ? "#F59E0B"
                                : "#10B981",
                          }}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-4">
                      <p className="text-sm text-zinc-400">Highest Risk Score</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {summary.highestRiskScore}
                      </p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(summary.highestRiskScore, 100)}%`,
                            backgroundColor:
                              summary.highestRiskScore > 60
                                ? "#F43F5E"
                                : summary.highestRiskScore > 30
                                ? "#F59E0B"
                                : "#10B981",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
