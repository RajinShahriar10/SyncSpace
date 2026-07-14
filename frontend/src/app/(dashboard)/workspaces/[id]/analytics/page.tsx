"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAnalyticsStore } from "@/features/analytics/stores/analyticsStore";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import OverviewCards from "@/features/analytics/components/OverviewCards";

const WorkspaceGrowthChart = dynamic(() => import("@/features/analytics/components/WorkspaceGrowthChart"), { loading: () => <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse" /> });
const TaskStatusChart = dynamic(() => import("@/features/analytics/components/TaskStatusChart"), { loading: () => <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse" /> });
const DocumentsTimelineChart = dynamic(() => import("@/features/analytics/components/DocumentsTimelineChart"), { loading: () => <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse" /> });
const MessagesTimelineChart = dynamic(() => import("@/features/analytics/components/MessagesTimelineChart"), { loading: () => <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse" /> });
const TopMembersChart = dynamic(() => import("@/features/analytics/components/TopMembersChart"), { loading: () => <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse" /> });

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace, fetchWorkspace } = useWorkspaceStore();
  const { overview, growth, topMembers, taskStatus, documentTimeline, messageTimeline, isLoading, fetchAll } = useAnalyticsStore();

  useEffect(() => {
    fetchWorkspace(workspaceId);
  }, [workspaceId, fetchWorkspace]);

  useEffect(() => {
    if (workspaceId) fetchAll(workspaceId);
  }, [workspaceId, fetchAll]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.push(`/workspaces/${workspaceId}`)}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-500/5">
              <BarChart3 className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
              <p className="text-sm text-muted-foreground">
                {currentWorkspace?.name} &middot; Performance and activity insights
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <OverviewCards overview={overview} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <div className="lg:col-span-2">
            <WorkspaceGrowthChart data={growth} />
          </div>
          <div>
            <TaskStatusChart data={taskStatus} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <DocumentsTimelineChart data={documentTimeline} />
          <MessagesTimelineChart data={messageTimeline} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TopMembersChart data={topMembers} />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
