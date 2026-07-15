"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown,
  ArrowLeft, BookOpen, Target, Activity, Zap, Calendar, Send,
  MessageSquare, FileText, ChevronRight, Flame, Star, Shield,
  BarChart3, Eye, MoreHorizontal,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInstructorDashboardStore } from "@/features/instructor/stores/instructorDashboardStore";
import { useCourseStore } from "@/features/courses/stores/courseStore";
import type { GroupMonitoring as GroupType, GroupHealthScoreData, ActivityTimelineEntry, ParticipationHeatmapEntry } from "@/lib/instructorDashboard";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function HealthScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#6366F1" : score >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{score}</span>
        <span className="text-[10px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function ProgressRing({ progress, size = 48 }: { progress: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#6366F1" strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

function HeatmapGrid({ data }: { data: ParticipationHeatmapEntry[] }) {
  const maxCount = Math.max(...data.map((d) => d.activityCount), 1);
  const weeks: ParticipationHeatmapEntry[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-1">
      <div className="flex gap-1 mb-2">
        {dayLabels.map((d) => (
          <span key={d} className="text-[10px] text-muted-foreground w-6 text-center">{d}</span>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="flex gap-1">
          {week.map((day, di) => {
            const intensity = maxCount > 0 ? day.activityCount / maxCount : 0;
            return (
              <motion.div
                key={di}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.01 }}
                className="w-6 h-6 rounded-sm cursor-pointer group relative"
                style={{
                  backgroundColor: intensity === 0 ? "rgba(255,255,255,0.03)" :
                    `rgba(99, 102, 241, ${Math.max(0.15, intensity)})`,
                }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {day.activityCount} activities
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function TimelineItem({ entry, index }: { entry: ActivityTimelineEntry; index: number }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    TaskCreated: CheckCircle2, TaskCompleted: CheckCircle2,
    DocumentEdited: FileText, FileUploaded: FileText,
    CommentAdded: MessageSquare, MessageSent: MessageSquare,
  };
  const colors: Record<string, string> = {
    TaskCreated: "text-blue-400 bg-blue-400/10",
    TaskCompleted: "text-emerald-400 bg-emerald-400/10",
    DocumentEdited: "text-primary bg-primary/10",
    FileUploaded: "text-cyan-400 bg-cyan-400/10",
    CommentAdded: "text-amber-400 bg-amber-400/10",
    MessageSent: "text-secondary bg-secondary/10",
  };
  const Icon = icons[entry.activityType] || Activity;
  const color = colors[entry.activityType] || "text-muted-foreground bg-white/5";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 py-2"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.studentName}</p>
        <p className="text-xs text-muted-foreground">{entry.activityType.replace(/([A-Z])/g, " $1").trim()}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-primary">+{entry.score}</p>
        <p className="text-[10px] text-muted-foreground">{new Date(entry.timestamp).toLocaleDateString()}</p>
      </div>
    </motion.div>
  );
}

function InstructorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("courseId");
  const { courses, fetchCourses } = useCourseStore();
  const {
    overview, groups, healthScores, contributions, timeline, heatmap,
    fetchAll, isLoading,
  } = useInstructorDashboardStore();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courseIdParam);
  const [activeTab, setActiveTab] = useState<"overview" | "groups" | "contributions" | "timeline">("overview");

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourseId) fetchAll(selectedCourseId);
  }, [selectedCourseId, fetchAll]);

  const healthScoreEntries = Object.values(healthScores);
  const avgHealth = healthScoreEntries.length > 0
    ? Math.round(healthScoreEntries.reduce((sum, h) => sum + h.totalScore, 0) / healthScoreEntries.length)
    : 0;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "groups" as const, label: "Groups", icon: Users },
    { id: "contributions" as const, label: "Contributions", icon: Zap },
    { id: "timeline" as const, label: "Timeline", icon: Clock },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-6 sm:p-8"
        >
          <div className="relative z-10">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
                <p className="text-muted-foreground">Monitor student progress and group performance</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
        </motion.div>

        {/* Course Selector */}
        <div className="flex flex-wrap gap-2">
          {courses.map((course) => (
            <Button
              key={course.id}
              variant={selectedCourseId === course.id ? "default" : "glass"}
              size="sm"
              onClick={() => setSelectedCourseId(course.id)}
              className="gap-2"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {course.courseCode}
            </Button>
          ))}
        </div>

        {!selectedCourseId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Course</h3>
              <p className="text-sm text-muted-foreground">Choose a course above to view the instructor dashboard</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {overview && (
              <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: "Total Groups", value: overview.totalGroups, icon: Users, color: "from-primary/20 to-primary/5", iconColor: "text-primary" },
                  { title: "Active Groups", value: overview.activeGroups, icon: Activity, color: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-400" },
                  { title: "At Risk", value: overview.atRiskGroups, icon: AlertTriangle, color: "from-red-500/20 to-red-600/5", iconColor: "text-red-400" },
                  { title: "Avg Health", value: `${avgHealth}%`, icon: Target, color: "from-amber-500/20 to-amber-600/5", iconColor: "text-amber-400" },
                ].map((stat) => (
                  <motion.div key={stat.title} variants={item}>
                    <Card className="transition-all duration-300 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
                          <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Upcoming Deadlines */}
                    <Card className="lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-amber-400" />
                          Upcoming Deadlines
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {overview?.upcomingDeadlines && overview.upcomingDeadlines.length > 0 ? (
                          <div className="space-y-3">
                            {overview.upcomingDeadlines.slice(0, 5).map((d, i) => (
                              <motion.div
                                key={d.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-3 rounded-xl glass p-3"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10">
                                  <Clock className="h-5 w-5 text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{d.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(d.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Calendar className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Group Health Scores */}
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          Group Health Scores
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {healthScoreEntries.map((health, i) => (
                            <motion.div
                              key={health.groupId}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className="glass rounded-xl p-4"
                            >
                              <div className="flex items-center gap-4">
                                <HealthScoreRing score={health.totalScore} size={72} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate">{health.groupName}</p>
                                  <p className={`text-xs font-medium ${
                                    health.category === "Excellent" ? "text-emerald-400" :
                                    health.category === "Good" ? "text-primary" :
                                    health.category === "Moderate" ? "text-amber-400" : "text-red-400"
                                  }`}>{health.category}</p>
                                  <div className="mt-1.5 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${health.taskCompletionScore / 40 * 100}%` }} />
                                      </div>
                                      <span className="text-[10px] text-muted-foreground w-8 text-right">{health.taskCompletionScore}/40</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${health.activityFrequencyScore / 30 * 100}%` }} />
                                      </div>
                                      <span className="text-[10px] text-muted-foreground w-8 text-right">{health.activityFrequencyScore}/30</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
                                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${health.deadlineComplianceScore / 30 * 100}%` }} />
                                      </div>
                                      <span className="text-[10px] text-muted-foreground w-8 text-right">{health.deadlineComplianceScore}/30</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {healthScoreEntries.length === 0 && (
                            <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center">
                              <Target className="h-8 w-8 text-muted-foreground/30 mb-2" />
                              <p className="text-sm text-muted-foreground">No health data available</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === "groups" && (
                  <div className="grid grid-cols-1 gap-4">
                    {groups.map((group, i) => {
                      const health = healthScores[group.groupId];
                      return (
                        <motion.div
                          key={group.groupId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Card className="transition-all hover:bg-white/[0.05]">
                            <CardContent className="p-5">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <ProgressRing progress={group.progress} size={56} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-base font-semibold">{group.groupName}</h3>
                                    {health && (
                                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                        health.category === "Excellent" ? "bg-emerald-500/10 text-emerald-400" :
                                        health.category === "Good" ? "bg-primary/10 text-primary" :
                                        health.category === "Moderate" ? "bg-amber-500/10 text-amber-400" :
                                        "bg-red-500/10 text-red-400"
                                      }`}>{health.category}</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {group.activeMembers}/{group.totalMembers} active</span>
                                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {group.completedTasks}/{group.totalTasks} tasks</span>
                                    <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> {group.completedMilestones}/{group.totalMilestones} milestones</span>
                                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {group.lastActivityAt ? `${Math.max(0, Math.floor((Date.now() - new Date(group.lastActivityAt).getTime()) / 86400000))}d ago` : "N/A"}</span>
                                  </div>
                                </div>
                                <div className="flex -space-x-2">
                                  {group.members.slice(0, 4).map((m) => (
                                    <div
                                      key={m.userId}
                                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary border-2 border-background"
                                      title={m.name}
                                    >
                                      {m.name.split(" ").map((n) => n[0]).join("")}
                                    </div>
                                  ))}
                                  {group.members.length > 4 && (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-muted-foreground border-2 border-background">
                                      +{group.members.length - 4}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                    {groups.length === 0 && (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                          <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">No groups in this course yet</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {activeTab === "contributions" && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Contribution Breakdown */}
                    <Card className="lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          Activity Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {contributions?.activityBreakdown && contributions.activityBreakdown.length > 0 ? (
                          <div className="space-y-4">
                            {contributions.activityBreakdown.map((ab, i) => {
                              const maxCount = Math.max(...contributions.activityBreakdown.map((x) => x.count), 1);
                              const width = (ab.count / maxCount) * 100;
                              return (
                                <div key={ab.activityType} className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{ab.activityType.replace(/([A-Z])/g, " $1").trim()}</span>
                                    <span className="text-sm text-muted-foreground">{ab.count}x</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.max(width, 2)}%` }}
                                      transition={{ duration: 0.6, delay: i * 0.1 }}
                                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Zap className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No contribution data yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Heatmap */}
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Flame className="h-4 w-4 text-orange-400" />
                          Participation Heatmap (4 weeks)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {heatmap.length > 0 ? (
                          <HeatmapGrid data={heatmap} />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Flame className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No participation data yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Top Contributors */}
                    <Card className="lg:col-span-3">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-400" />
                          Student Contributions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {contributions?.studentContributions && contributions.studentContributions.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/5">
                                  <th className="pb-3 text-left font-medium text-muted-foreground">Student</th>
                                  <th className="pb-3 text-right font-medium text-muted-foreground">Activities</th>
                                  <th className="pb-3 text-right font-medium text-muted-foreground">Score</th>
                                  <th className="pb-3 text-right font-medium text-muted-foreground hidden sm:table-cell">Tasks</th>
                                  <th className="pb-3 text-right font-medium text-muted-foreground hidden sm:table-cell">Docs</th>
                                  <th className="pb-3 text-right font-medium text-muted-foreground hidden sm:table-cell">Messages</th>
                                </tr>
                              </thead>
                              <tbody>
                                {contributions.studentContributions.map((sc, i) => (
                                  <motion.tr
                                    key={sc.studentId}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                                  >
                                    <td className="py-3">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                                          {sc.studentName.split(" ").map((n) => n[0]).join("")}
                                        </div>
                                        <span className="font-medium">{sc.studentName}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 text-right text-muted-foreground">{sc.activityCount}</td>
                                    <td className="py-3 text-right font-semibold text-primary">{sc.totalScore.toFixed(1)}</td>
                                    <td className="py-3 text-right text-muted-foreground hidden sm:table-cell">{sc.breakdown.TaskCompleted || 0}</td>
                                    <td className="py-3 text-right text-muted-foreground hidden sm:table-cell">{sc.breakdown.DocumentEdited || 0}</td>
                                    <td className="py-3 text-right text-muted-foreground hidden sm:table-cell">{sc.breakdown.MessageSent || 0}</td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Star className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No student data yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {timeline.length > 0 ? (
                          <div className="space-y-1 max-h-[500px] overflow-y-auto">
                            {timeline.slice(0, 30).map((entry, i) => (
                              <TimelineItem key={entry.id} entry={entry} index={i} />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-400" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { label: "Send Announcement", desc: "Broadcast to all groups", icon: Send, color: "text-primary bg-primary/10" },
                            { label: "Leave Feedback", desc: "Review and comment on work", icon: MessageSquare, color: "text-emerald-400 bg-emerald-400/10" },
                            { label: "Request Progress Update", desc: "Ask groups for status", icon: FileText, color: "text-amber-400 bg-amber-400/10" },
                          ].map((action, i) => (
                            <motion.button
                              key={action.label}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex w-full items-center gap-4 rounded-xl glass p-4 text-left transition-all hover:bg-white/[0.05] group"
                            >
                              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${action.color}`}>
                                <action.icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold">{action.label}</p>
                                <p className="text-xs text-muted-foreground">{action.desc}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function InstructorDashboardPage() {
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
      <InstructorDashboardContent />
    </Suspense>
  );
}
