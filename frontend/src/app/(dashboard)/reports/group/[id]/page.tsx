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
  Download,
  Users,
  Target,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  Printer,
  FileSpreadsheet,
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
import {
  exportToPDF,
  exportToExcel,
  exportGroupReportToExcel,
} from "@/lib/export";

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

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

function riskBadgeColor(level: string) {
  switch (level?.toLowerCase()) {
    case "high":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default:
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
}

function riskFactorColor(level: string) {
  switch (level?.toLowerCase()) {
    case "high":
      return COLORS.rose;
    case "medium":
      return COLORS.amber;
    default:
      return COLORS.emerald;
  }
}

export default function GroupReportPage() {
  const router = useRouter();
  const params = useParams();
  const projectGroupId = params.id as string;

  const { fetchGroupReport, groupReport, isLoading } = useReportStore();

  useEffect(() => {
    if (projectGroupId) {
      fetchGroupReport(projectGroupId);
    }
  }, [projectGroupId, fetchGroupReport]);

  const handlePrint = () => {
    exportToPDF("printable-report", "Group Report");
  };

  const handleExportExcel = () => {
    if (groupReport) {
      exportGroupReportToExcel(groupReport);
    }
  };

  const handleExportCSV = () => {
    if (!groupReport) return;

    const rows: (string | number)[][] = [
      ["Metric", "Value"],
      ["Group Name", groupReport.groupName],
      ["Course", `${groupReport.courseName} (${groupReport.courseCode})`],
      ["Leader", groupReport.leaderName],
      ["Total Tasks", groupReport.progress.totalTasks],
      ["Completed Tasks", groupReport.progress.completedTasks],
      ["Task Completion %", groupReport.progress.taskCompletionPercent],
      ["Total Milestones", groupReport.progress.totalMilestones],
      ["Completed Milestones", groupReport.progress.completedMilestones],
      ["Delayed Milestones", groupReport.progress.delayedMilestones],
      ["Milestone Completion %", groupReport.progress.milestoneCompletionPercent],
      [],
      ["Member", "Role", "Score", "Tasks", "Docs", "Files", "Contribution %"],
      ...groupReport.members.map((m) => [
        m.fullName,
        m.isLeader ? "Leader" : "Member",
        m.totalScore,
        m.tasksCompleted,
        m.documentsEdited,
        m.filesUploaded,
        m.contributionPercent,
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `group-report-${projectGroupId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !groupReport) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
            <p className="text-sm text-zinc-500">Loading group report…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const report = groupReport;
  const { progress } = report;
  const risk = report.riskSummary;

  const barData = report.contributionDistribution.map((d) => ({
    name: d.name.split(" ")[0],
    score: d.score,
  }));

  const activityData = report.activityTrend.map((a) => ({
    week: a.label,
    score: a.score,
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
                {report.groupName}
              </h1>
              <p className="text-sm text-zinc-500">
                {report.courseName} · {report.courseCode}
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
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        {/* Printable Report */}
        <div id="printable-report" className="space-y-6">
          {/* Group Info Header */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="flex items-center gap-5 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6366f1] text-xl font-bold text-white shadow-lg shadow-purple-500/20">
                  <Users className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    {report.groupName}
                  </h2>
                  <p className="text-sm text-zinc-400">
                    {report.courseName} · {report.courseCode}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Led by {report.leaderName}
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

          {/* Progress Cards */}
          <motion.div variants={fadeIn} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Task Progress */}
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm font-medium text-zinc-400">Task Progress</p>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {progress.taskCompletionPercent}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progress.taskCompletionPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {progress.completedTasks} of {progress.totalTasks} tasks completed
                </p>
              </CardContent>
            </Card>

            {/* Milestone Progress */}
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#6366f1]" />
                    <p className="text-sm font-medium text-zinc-400">Milestone Progress</p>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {progress.milestoneCompletionPercent}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#8B5CF6] transition-all duration-500"
                    style={{ width: `${progress.milestoneCompletionPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {progress.completedMilestones} of {progress.totalMilestones} milestones completed
                  {progress.delayedMilestones > 0 && (
                    <span className="ml-2 text-amber-400">
                      · {progress.delayedMilestones} delayed
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Team Contribution Distribution */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <TrendingUp className="h-4 w-4 text-[#6366f1]" />
                  Team Contribution Distribution
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  Individual contribution scores across team members
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="name"
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
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {barData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Member Details Table */}
          <motion.div variants={fadeIn}>
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Users className="h-4 w-4 text-[#8B5CF6]" />
                  Member Details
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  {report.members.length} member{report.members.length !== 1 ? "s" : ""} in this group
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="pb-3 text-left font-medium text-zinc-400">Name</th>
                        <th className="pb-3 text-left font-medium text-zinc-400">Role</th>
                        <th className="pb-3 text-right font-medium text-zinc-400">Score</th>
                        <th className="pb-3 text-right font-medium text-zinc-400">Tasks</th>
                        <th className="pb-3 text-right font-medium text-zinc-400">Docs</th>
                        <th className="pb-3 text-right font-medium text-zinc-400">Files</th>
                        <th className="pb-3 text-right font-medium text-zinc-400">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {report.members.map((member) => (
                        <tr key={member.userId} className="hover:bg-white/[0.02]">
                          <td className="py-3 text-zinc-200">{member.fullName}</td>
                          <td className="py-3">
                            {member.isLeader ? (
                              <span className="inline-flex items-center rounded-full bg-[#6366f1]/10 px-2.5 py-0.5 text-xs font-medium text-[#6366f1]">
                                Leader
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                                Member
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right font-medium text-white">
                            {member.totalScore.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-zinc-300">
                            {member.tasksCompleted}
                          </td>
                          <td className="py-3 text-right text-zinc-300">
                            {member.documentsEdited}
                          </td>
                          <td className="py-3 text-right text-zinc-300">
                            {member.filesUploaded}
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-white font-medium">
                              {member.contributionPercent}%
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

          {/* Risk Summary */}
          {risk && (
            <motion.div variants={fadeIn}>
              <Card className="border-zinc-800/60 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-white">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Risk Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${riskBadgeColor(risk.riskLevel)}`}>
                      {risk.riskLevel?.toUpperCase()} RISK
                    </span>
                    <span className="text-sm text-zinc-400">
                      Overall Risk Score: <span className="text-white font-medium">{risk.overallScore}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      { label: "Inactive Members", value: risk.inactiveMembers, max: report.members.length || 1 },
                      { label: "Delayed Milestones", value: risk.delayedMilestones, max: progress.totalMilestones || 1 },
                      { label: "Low Contribution", value: risk.lowContribution, max: report.members.length || 1 },
                      { label: "Communication Issues", value: risk.communication, max: 10 },
                      { label: "Task Bottleneck", value: risk.taskBottleneck, max: progress.totalTasks || 1 },
                    ].map((factor) => {
                      const pct = Math.min((factor.value / factor.max) * 100, 100);
                      return (
                        <div key={factor.label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-zinc-400">{factor.label}</span>
                            <span className="text-xs font-medium text-zinc-300">{factor.value}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: riskFactorColor(risk.riskLevel),
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Activity Trend */}
          {activityData.length > 0 && (
            <motion.div variants={fadeIn}>
              <Card className="border-zinc-800/60 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-white">
                    <Activity className="h-4 w-4 text-[#06B6D4]" />
                    Activity Trend
                  </CardTitle>
                  <p className="text-xs text-zinc-500">
                    Group activity over time
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData}>
                        <defs>
                          <linearGradient id="groupActivityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
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
                          stroke={COLORS.accent}
                          strokeWidth={2}
                          fill="url(#groupActivityGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
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
