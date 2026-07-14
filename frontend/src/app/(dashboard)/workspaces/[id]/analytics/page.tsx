"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { BarChart3, Loader2 } from "lucide-react";
import { useAnalyticsStore } from "@/features/analytics/stores/analyticsStore";
import { useWorkspaceSelectionStore } from "@/store";
import OverviewCards from "@/features/analytics/components/OverviewCards";

const WorkspaceGrowthChart = dynamic(() => import("@/features/analytics/components/WorkspaceGrowthChart"), { loading: () => <div className="h-64 bg-white/5 rounded-xl animate-pulse" /> });
const TaskStatusChart = dynamic(() => import("@/features/analytics/components/TaskStatusChart"), { loading: () => <div className="h-64 bg-white/5 rounded-xl animate-pulse" /> });
const DocumentsTimelineChart = dynamic(() => import("@/features/analytics/components/DocumentsTimelineChart"), { loading: () => <div className="h-64 bg-white/5 rounded-xl animate-pulse" /> });
const MessagesTimelineChart = dynamic(() => import("@/features/analytics/components/MessagesTimelineChart"), { loading: () => <div className="h-64 bg-white/5 rounded-xl animate-pulse" /> });
const TopMembersChart = dynamic(() => import("@/features/analytics/components/TopMembersChart"), { loading: () => <div className="h-64 bg-white/5 rounded-xl animate-pulse" /> });

export default function AnalyticsPage() {
  const params = useParams();
  const workspaceId = (params.id as string) || useWorkspaceSelectionStore.getState().currentWorkspaceId || "";
  const { overview, growth, topMembers, taskStatus, documentTimeline, messageTimeline, isLoading, fetchAll } = useAnalyticsStore();

  useEffect(() => {
    if (workspaceId) fetchAll(workspaceId);
  }, [workspaceId, fetchAll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[#6366F1]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-200">Analytics</h1>
          <p className="text-sm text-zinc-500">Workspace performance and activity insights</p>
        </div>
      </div>

      <OverviewCards overview={overview} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WorkspaceGrowthChart data={growth} />
        </div>
        <div>
          <TaskStatusChart data={taskStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DocumentsTimelineChart data={documentTimeline} />
        <MessagesTimelineChart data={messageTimeline} />
      </div>

      <TopMembersChart data={topMembers} />
    </div>
  );
}
