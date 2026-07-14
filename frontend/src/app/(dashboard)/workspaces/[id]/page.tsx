"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import {
  ArrowLeft, Settings, Users, FileText, MessageSquare,
  KanbanSquare, FolderOpen, Activity, BarChart3, ArrowRight,
  Upload, Layout
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace, fetchWorkspace, isLoading, members, fetchMembers } = useWorkspaceStore();

  useEffect(() => {
    fetchWorkspace(workspaceId);
    fetchMembers(workspaceId);
  }, [workspaceId, fetchWorkspace, fetchMembers]);

  if (!currentWorkspace && isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const sections = [
    {
      icon: FileText,
      label: "Documents",
      desc: "Create and edit docs",
      href: `/workspaces/${workspaceId}/documents`,
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
    },
    {
      icon: KanbanSquare,
      label: "Boards",
      desc: "Kanban project boards",
      href: `/workspaces/${workspaceId}/boards`,
      gradient: "from-secondary/20 to-secondary/5",
      iconColor: "text-secondary",
    },
    {
      icon: MessageSquare,
      label: "Chat",
      desc: "Real-time messaging",
      href: `/workspaces/${workspaceId}/chat`,
      gradient: "from-accent/20 to-accent/5",
      iconColor: "text-accent",
    },
    {
      icon: Upload,
      label: "Files",
      desc: "File management",
      href: `/workspaces/${workspaceId}/files`,
      gradient: "from-cyan-500/20 to-cyan-500/5",
      iconColor: "text-cyan-400",
    },
    {
      icon: Users,
      label: "Members",
      desc: "Team access control",
      href: `/workspaces/${workspaceId}/members`,
      gradient: "from-emerald-500/20 to-emerald-500/5",
      iconColor: "text-emerald-400",
    },
    {
      icon: Activity,
      label: "Activity",
      desc: "Recent changes",
      href: `/workspaces/${workspaceId}/activity`,
      gradient: "from-amber-500/20 to-amber-500/5",
      iconColor: "text-amber-400",
    },
    {
      icon: BarChart3,
      label: "Analytics",
      desc: "Workspace insights",
      href: `/workspaces/${workspaceId}/analytics`,
      gradient: "from-rose-500/20 to-rose-500/5",
      iconColor: "text-rose-400",
    },
    {
      icon: Settings,
      label: "Settings",
      desc: "Configure workspace",
      href: `/workspaces/${workspaceId}/settings`,
      gradient: "from-violet-500/20 to-violet-500/5",
      iconColor: "text-violet-400",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            variant="ghost"
            onClick={() => router.push("/workspaces")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            All Workspaces
          </Button>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-6 sm:p-8">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl font-bold text-primary shrink-0">
                {currentWorkspace?.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{currentWorkspace?.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {currentWorkspace?.description || "No description"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => router.push(`/workspaces/${workspaceId}/settings`)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <Card className="group cursor-pointer transition-all hover:bg-white/[0.07]" onClick={() => router.push(`/workspaces/${workspaceId}/members`)}>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{currentWorkspace?.memberCount ?? members.length}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer transition-all hover:bg-white/[0.07]" onClick={() => router.push(`/workspaces/${workspaceId}/documents`)}>
            <CardContent className="p-4 text-center">
              <FileText className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">Docs</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer transition-all hover:bg-white/[0.07]" onClick={() => router.push(`/workspaces/${workspaceId}/boards`)}>
            <CardContent className="p-4 text-center">
              <Layout className="h-5 w-5 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">Boards</p>
              <p className="text-xs text-muted-foreground">Task Boards</p>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer transition-all hover:bg-white/[0.07]" onClick={() => router.push(`/workspaces/${workspaceId}/files`)}>
            <CardContent className="p-4 text-center">
              <FolderOpen className="h-5 w-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">Files</p>
              <p className="text-xs text-muted-foreground">Storage</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sections Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-base font-semibold mb-4">Workspace Sections</h2>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {sections.map((section) => (
              <motion.div key={section.label} variants={item}>
                <Card
                  className="group cursor-pointer transition-all duration-300 hover:bg-white/[0.07] hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5"
                  onClick={() => router.push(section.href)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${section.gradient}`}>
                        <section.icon className={`h-5 w-5 ${section.iconColor} group-hover:scale-110 transition-transform`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{section.label}</p>
                        <p className="text-xs text-muted-foreground">{section.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Members Preview */}
        {members.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Team Members</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => router.push(`/workspaces/${workspaceId}/members`)}
              >
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.slice(0, 8).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-sm"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-xs font-bold text-primary">
                    {member.userName?.[0]?.toUpperCase() || member.userEmail?.[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium">{member.userName || member.userEmail}</span>
                  <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                </div>
              ))}
              {members.length > 8 && (
                <div className="flex items-center rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-xs text-muted-foreground">
                  +{members.length - 8} more
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
