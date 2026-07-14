"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Activity, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuditStore } from "@/features/audit/stores/auditStore";
import { useWorkspaceSelectionStore } from "@/store";
import ActivityTimeline from "@/features/audit/components/ActivityTimeline";

const ACTION_FILTERS = [
  { value: "", label: "All" },
  { value: "UserLogin", label: "Logins" },
  { value: "TaskCreated", label: "Tasks" },
  { value: "DocumentEdited", label: "Documents" },
  { value: "RoleChanged", label: "Roles" },
  { value: "FileUploaded", label: "Files" },
  { value: "MemberInvited", label: "Members" },
];

export default function ActivityPage() {
  const params = useParams();
  const workspaceId = (params.id as string) || useWorkspaceSelectionStore.getState().currentWorkspaceId || "";
  const { logs, pagination, isLoading, filter, fetchLogs, setFilter, clearFilter } = useAuditStore();

  useEffect(() => {
    if (workspaceId) fetchLogs(workspaceId, 1);
  }, [workspaceId, filter, fetchLogs]);

  const handlePageChange = (page: number) => {
    if (workspaceId) fetchLogs(workspaceId, page);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#6366F1]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-200">Activity</h1>
            <p className="text-sm text-zinc-500">Audit timeline of your workspace</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-500" />
        {ACTION_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => f.value ? setFilter({ action: f.value }) : clearFilter()}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              (f.value === "" && !filter.action) || filter.action === f.value
                ? "bg-[#6366F1]/20 text-[#6366F1]"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-white/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
        </div>
      ) : (
        <ActivityTimeline logs={logs} />
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-zinc-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
