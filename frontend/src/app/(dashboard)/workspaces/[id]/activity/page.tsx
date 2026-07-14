"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Activity, Loader2, Filter, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuditStore } from "@/features/audit/stores/auditStore";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
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
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace, fetchWorkspace } = useWorkspaceStore();
  const { logs, pagination, isLoading, filter, fetchLogs, setFilter, clearFilter } = useAuditStore();

  useEffect(() => {
    fetchWorkspace(workspaceId);
  }, [workspaceId, fetchWorkspace]);

  useEffect(() => {
    if (workspaceId) fetchLogs(workspaceId, 1);
  }, [workspaceId, filter, fetchLogs]);

  const handlePageChange = (page: number) => {
    if (workspaceId) fetchLogs(workspaceId, page);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5">
              <Activity className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
              <p className="text-sm text-muted-foreground">
                {currentWorkspace?.name} &middot; Audit timeline
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                {ACTION_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => f.value ? setFilter({ action: f.value }) : clearFilter()}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      (f.value === "" && !filter.action) || filter.action === f.value
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ActivityTimeline logs={logs} />
          </motion.div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 pt-4"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
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
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
