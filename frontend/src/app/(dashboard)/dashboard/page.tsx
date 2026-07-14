"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText, KanbanSquare, MessageSquare, Users, Plus, ArrowRight,
  BarChart3, FolderOpen, Clock, TrendingUp, Zap
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";
import { useAdminStore } from "@/features/admin/stores/adminStore";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { overview, fetchOverview } = useAdminStore();
  const { workspaces, fetchWorkspaces } = useWorkspaceStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOverview();
      fetchWorkspaces();
    }
  }, [isAuthenticated, fetchOverview, fetchWorkspaces]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated || !user) return null;

  const stats = [
    {
      title: "Workspaces",
      value: overview?.totalWorkspaces ?? 0,
      icon: FolderOpen,
      color: "from-violet-500/20 to-violet-600/5",
      iconColor: "text-violet-400",
      href: "/workspaces",
    },
    {
      title: "Documents",
      value: overview?.totalDocuments ?? 0,
      change: `+${overview?.documentsLast30Days ?? 0} this month`,
      icon: FileText,
      color: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      href: "/documents",
    },
    {
      title: "Board Tasks",
      value: overview?.totalTasks ?? 0,
      icon: KanbanSquare,
      color: "from-secondary/20 to-secondary/5",
      iconColor: "text-secondary",
      href: "/boards",
    },
    {
      title: "Messages",
      value: overview?.totalMessages ?? 0,
      change: `+${overview?.messagesLast30Days ?? 0} this month`,
      icon: MessageSquare,
      color: "from-accent/20 to-accent/5",
      iconColor: "text-accent",
      href: "/messages",
    },
  ];

  const quickActions = [
    { label: "New Workspace", icon: FolderOpen, href: "/workspaces", color: "bg-violet-500/10 text-violet-400" },
    { label: "New Document", icon: FileText, href: "/documents", color: "bg-primary/10 text-primary" },
    { label: "View Boards", icon: KanbanSquare, href: "/boards", color: "bg-secondary/10 text-secondary" },
    { label: "Team Chat", icon: MessageSquare, href: "/messages", color: "bg-accent/10 text-accent" },
    { label: "Analytics", icon: BarChart3, href: "/analytics", color: "bg-emerald-500/10 text-emerald-400" },
    { label: "Admin Panel", icon: Zap, href: "/admin", color: "bg-amber-500/10 text-amber-400" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-6 sm:p-8"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👋</span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back, {user.firstName}
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening across your workspaces today.
            </p>
          </div>
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-secondary/5 blur-2xl" />
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div key={stat.title} variants={item}>
              <Card
                className="group cursor-pointer transition-all duration-300 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5"
                onClick={() => router.push(stat.href)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  {stat.change && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Workspaces */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Workspaces</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => router.push("/workspaces")}>
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {workspaces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No workspaces yet</p>
                    <Button size="sm" className="mt-3 gap-1" onClick={() => router.push("/workspaces")}>
                      <Plus className="h-3 w-3" /> Create one
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workspaces.slice(0, 5).map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => router.push(`/workspaces/${ws.id}`)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/[0.05] group"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-bold text-primary">
                          {ws.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ws.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ws.description || "No description"} &middot; {ws.memberCount} members
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => router.push(action.href)}
                      className="flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all hover:bg-white/[0.05] hover:-translate-y-0.5 duration-200"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Platform Stats */}
        {overview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl bg-white/[0.03] p-4 text-center">
                    <Users className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{overview.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-4 text-center">
                    <FolderOpen className="h-5 w-5 text-violet-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{overview.totalWorkspaces}</p>
                    <p className="text-xs text-muted-foreground">Workspaces</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-4 text-center">
                    <FileText className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{overview.totalDocuments}</p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-4 text-center">
                    <FolderOpen className="h-5 w-5 text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{formatBytes(overview.totalStorageBytes)}</p>
                    <p className="text-xs text-muted-foreground">Storage Used</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
