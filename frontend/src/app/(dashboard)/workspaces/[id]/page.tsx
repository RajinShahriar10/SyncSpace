"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import { ArrowLeft, Settings, Users, FileText, MessageSquare } from "lucide-react";

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace, fetchWorkspace, isLoading } = useWorkspaceStore();

  useEffect(() => {
    fetchWorkspace(workspaceId);
  }, [workspaceId, fetchWorkspace]);

  if (!currentWorkspace && isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const quickActions = [
    {
      icon: FileText,
      label: "Documents",
      desc: "Create and edit documents",
      href: `/workspaces/${workspaceId}/documents`,
      color: "text-primary",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      desc: "Team messaging",
      href: `/workspaces/${workspaceId}/messages`,
      color: "text-accent",
    },
    {
      icon: Users,
      label: "Members",
      desc: "Manage team access",
      href: `/workspaces/${workspaceId}/members`,
      color: "text-secondary",
    },
    {
      icon: Settings,
      label: "Settings",
      desc: "Workspace configuration",
      href: `/workspaces/${workspaceId}/settings`,
      color: "text-muted-foreground",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            variant="ghost"
            onClick={() => router.push("/workspaces")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            All Workspaces
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl font-bold text-primary">
              {currentWorkspace?.name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{currentWorkspace?.name}</h1>
              <p className="text-muted-foreground">
                {currentWorkspace?.description || "No description"}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <Card
                className="cursor-pointer transition-all hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5"
                onClick={() => router.push(action.href)}
              >
                <CardHeader>
                  <action.icon className={`mb-2 h-6 w-6 ${action.color}`} />
                  <CardTitle className="text-base">{action.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{action.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
