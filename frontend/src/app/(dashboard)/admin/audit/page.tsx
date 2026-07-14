"use client";

import { useState, useEffect } from "react";
import { ScrollText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminStore } from "@/features/admin/stores/adminStore";

const actionFilters = [
  "All",
  "UserLogin",
  "TaskCreated",
  "DocumentEdited",
  "RoleChanged",
  "FileUploaded",
  "MemberInvited",
];

const actionColors: Record<string, string> = {
  UserLogin: "bg-blue-400/10 text-blue-400",
  TaskCreated: "bg-[#10B981]/10 text-[#10B981]",
  DocumentEdited: "bg-yellow-400/10 text-yellow-400",
  RoleChanged: "bg-[#6366F1]/10 text-[#6366F1]",
  FileUploaded: "bg-orange-400/10 text-orange-400",
  MemberInvited: "bg-purple-400/10 text-purple-400",
};

export default function AdminAuditPage() {
  const { auditLogs, auditPagination, isLoading, fetchAuditLogs } = useAdminStore();

  const [actionFilter, setActionFilter] = useState("All");

  useEffect(() => {
    const action = actionFilter === "All" ? undefined : actionFilter;
    fetchAuditLogs({ action, page: 1 });
  }, [actionFilter, fetchAuditLogs]);

  const handlePageChange = (page: number) => {
    const action = actionFilter === "All" ? undefined : actionFilter;
    fetchAuditLogs({ action, page });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-4 sm:px-0">
        <div className="p-2 rounded-xl bg-[#6366F1]/10">
          <ScrollText className="w-5 h-5 text-[#6366F1]" />
        </div>
        <div>
          <h1 className="text-zinc-200 font-semibold text-lg">Audit Log</h1>
          <p className="text-sm text-zinc-500">Track all actions and events across the platform</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/5 p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {actionFilters.map((action) => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                actionFilter === action
                  ? "bg-[#6366F1] text-white"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              }`}
            >
              {action === "All" ? "All" : action.replace(/([A-Z])/g, " $1").trim()}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-white/5">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Entity Type</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">IP</th>
                  <th className="pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs?.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 text-zinc-200">{log.userName}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          actionColors[log.action] ?? "bg-zinc-400/10 text-zinc-400"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-400">{log.entityType}</td>
                    <td className="py-3 text-zinc-400 max-w-[250px] truncate">{log.description}</td>
                    <td className="py-3 text-zinc-500 font-mono text-xs">{log.ipAddress}</td>
                    <td className="py-3 text-zinc-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!auditLogs || auditLogs.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {auditPagination && auditPagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-zinc-500">
              Page {auditPagination.page} of {auditPagination.totalPages} ({auditPagination.totalCount} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(auditPagination.page - 1)}
                disabled={auditPagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => handlePageChange(auditPagination.page + 1)}
                disabled={auditPagination.page >= auditPagination.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
