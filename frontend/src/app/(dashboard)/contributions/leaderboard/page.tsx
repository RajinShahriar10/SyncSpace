"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Trophy, Medal, Crown, TrendingUp, Users, Target,
  ArrowLeft, Flame, Star, Zap, Clock, FileText,
  MessageSquare, CheckCircle2, Upload, Plus,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useContributionStore } from "@/features/contributions/stores/contributionStore";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import type { LeaderboardEntry, WeeklyActivity, ActivityScore } from "@/lib/contribution";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TaskCreated: Plus,
  TaskCompleted: CheckCircle2,
  DocumentEdited: FileText,
  FileUploaded: Upload,
  CommentAdded: MessageSquare,
  MessageSent: MessageSquare,
};

const activityColors: Record<string, string> = {
  TaskCreated: "text-blue-400 bg-blue-400/10",
  TaskCompleted: "text-emerald-400 bg-emerald-400/10",
  DocumentEdited: "text-primary bg-primary/10",
  FileUploaded: "text-cyan-400 bg-cyan-400/10",
  CommentAdded: "text-amber-400 bg-amber-400/10",
  MessageSent: "text-secondary bg-secondary/10",
};

const rankIcons: Record<number, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  1: { icon: Crown, color: "text-yellow-400" },
  2: { icon: Medal, color: "text-gray-300" },
  3: { icon: Medal, color: "text-amber-600" },
};

function WeeklyChart({ data }: { data: WeeklyActivity[] }) {
  const maxScore = Math.max(...data.map((d) => d.totalScore), 1);

  return (
    <div className="flex items-end gap-3 h-48">
      {data.map((week, i) => {
        const height = (week.totalScore / maxScore) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 4)}%` }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full rounded-t-lg bg-gradient-to-t from-primary/60 to-primary/20 relative group cursor-pointer"
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded px-2 py-0.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {week.totalScore.toFixed(1)} pts
              </div>
            </motion.div>
            <span className="text-xs text-muted-foreground">{week.weekLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityBreakdownChart({ activities }: { activities: ActivityScore[] }) {
  const maxPoints = Math.max(...activities.map((a) => a.totalPoints), 1);

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const width = (activity.totalPoints / maxPoints) * 100;
        const Icon = activityIcons[activity.activityType] || Target;
        const colorClass = activityColors[activity.activityType] || "text-muted-foreground bg-white/5";

        return (
          <div key={activity.activityType} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-md ${colorClass}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium">{activity.activityType}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">{activity.count}x</span>
                <span className="font-semibold">{activity.totalPoints.toFixed(1)} pts</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(width, 2)}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  activity.activityType === "TaskCompleted"
                    ? "from-emerald-500 to-emerald-400"
                    : activity.activityType === "DocumentEdited"
                      ? "from-primary to-secondary"
                      : activity.activityType === "FileUploaded"
                        ? "from-cyan-500 to-cyan-400"
                        : activity.activityType === "CommentAdded"
                          ? "from-amber-500 to-amber-400"
                          : activity.activityType === "MessageSent"
                            ? "from-secondary to-accent"
                            : "from-blue-500 to-blue-400"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const rankData = rankIcons[entry.rank];
        const RankIcon = rankData?.icon || Target;

        return (
          <motion.div
            key={entry.studentId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all hover:bg-white/[0.05] ${
              entry.rank <= 3 ? "glass" : ""
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
              entry.rank === 1
                ? "bg-yellow-400/10 text-yellow-400"
                : entry.rank === 2
                  ? "bg-gray-300/10 text-gray-300"
                  : entry.rank === 3
                    ? "bg-amber-600/10 text-amber-600"
                    : "bg-white/5 text-muted-foreground"
            }`}>
              {rankData ? (
                <RankIcon className={`h-5 w-5 ${rankData.color}`} />
              ) : (
                <span className="text-sm">#{entry.rank}</span>
              )}
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              {entry.studentName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{entry.studentName}</p>
              <p className="text-xs text-muted-foreground">
                {entry.totalActivities} activities
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold">{entry.contributionPercentage.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">{entry.score.toFixed(1)} pts</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const { currentWorkspace, fetchWorkspace, workspaces, fetchWorkspaces } = useWorkspaceStore();
  const {
    leaderboard,
    weeklyActivity,
    topContributors,
    breakdown,
    fetchLeaderboard,
    fetchWeeklyActivity,
    fetchTopContributors,
    fetchBreakdown,
    isLoading,
  } = useContributionStore();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(workspaceId);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchLeaderboard(selectedGroupId);
      fetchWeeklyActivity(selectedGroupId, 4);
      fetchTopContributors(selectedGroupId);
    }
  }, [selectedGroupId, fetchLeaderboard, fetchWeeklyActivity, fetchTopContributors]);

  const topContributor = leaderboard[0];

  const stats = [
    {
      title: "Top Contributor",
      value: topContributor?.studentName || "N/A",
      subtitle: topContributor ? `${topContributor.score.toFixed(1)} pts` : "No data",
      icon: Crown,
      color: "from-yellow-500/20 to-yellow-600/5",
      iconColor: "text-yellow-400",
    },
    {
      title: "Most Active",
      value: [...leaderboard].sort((a, b) => b.totalActivities - a.totalActivities)[0]?.studentName || "N/A",
      subtitle: `${[...leaderboard].sort((a, b) => b.totalActivities - a.totalActivities)[0]?.totalActivities || 0} activities`,
      icon: Flame,
      color: "from-orange-500/20 to-orange-600/5",
      iconColor: "text-orange-400",
    },
    {
      title: "Weekly Trend",
      value: weeklyActivity.length > 0 ? `${weeklyActivity[weeklyActivity.length - 1]?.totalScore.toFixed(1) || 0} pts` : "0 pts",
      subtitle: "This week",
      icon: TrendingUp,
      color: "from-emerald-500/20 to-emerald-600/5",
      iconColor: "text-emerald-400",
    },
    {
      title: "Total Members",
      value: leaderboard.length.toString(),
      subtitle: "Active contributors",
      icon: Users,
      color: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-yellow-500/5 via-transparent to-primary/5 p-6 sm:p-8"
        >
          <div className="relative z-10">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500/20 to-primary/20">
                <Trophy className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Contribution Leaderboard
                </h1>
                <p className="text-muted-foreground">
                  Track student contributions and team performance
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-yellow-500/5 blur-3xl" />
          <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div key={stat.title} variants={item}>
              <Card className="transition-all duration-300 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight truncate">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Weekly Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Weekly Activity Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyActivity.length > 0 ? (
                  <WeeklyChart data={weeklyActivity} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No weekly data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Contributors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topContributors.length > 0 ? (
                  <div className="space-y-3">
                    {topContributors.map((entry, i) => {
                      const rankData = rankIcons[entry.rank];
                      const RankIcon = rankData?.icon || Target;
                      return (
                        <motion.div
                          key={entry.studentId}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="flex items-center gap-3 rounded-xl glass p-3"
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            entry.rank === 1
                              ? "bg-yellow-400/10"
                              : entry.rank === 2
                                ? "bg-gray-300/10"
                                : "bg-amber-600/10"
                          }`}>
                            <RankIcon className={`h-5 w-5 ${rankData?.color || "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{entry.studentName}</p>
                            <p className="text-xs text-muted-foreground">{entry.contributionPercentage.toFixed(1)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{entry.score.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">pts</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Star className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No contributors yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  Full Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length > 0 ? (
                  <LeaderboardTable entries={leaderboard} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Trophy className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No leaderboard data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Activity Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { activity: "Task Completed", points: 15, icon: CheckCircle2, color: "text-emerald-400 bg-emerald-400/10" },
                    { activity: "Task Created", points: 5, icon: Plus, color: "text-blue-400 bg-blue-400/10" },
                    { activity: "Document Edited", points: 3, icon: FileText, color: "text-primary bg-primary/10" },
                    { activity: "File Uploaded", points: 2, icon: Upload, color: "text-cyan-400 bg-cyan-400/10" },
                    { activity: "Comment Added", points: 1, icon: MessageSquare, color: "text-amber-400 bg-amber-400/10" },
                    { activity: "Message Sent", points: 0.5, icon: MessageSquare, color: "text-secondary bg-secondary/10" },
                  ].map((item) => (
                    <div key={item.activity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{item.activity}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{item.points} pts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ContributionLeaderboardPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </DashboardLayout>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
