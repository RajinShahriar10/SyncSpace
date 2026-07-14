"use client";

import { memo, useMemo } from "react";
import {
  LogIn, LogOut, UserPlus, CheckSquare, FileText, Shield, Upload, FolderOpen,
  Pencil, Trash2, ArrowRight, MessageSquare, Settings, File,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AuditLogEntry } from "@/lib/audit";

const ACTION_CONFIG: Record<string, {
  icon: typeof LogIn;
  color: string;
  bgColor: string;
  label: string;
}> = {
  UserLogin: { icon: LogIn, color: "text-[#10B981]", bgColor: "bg-[#10B981]/10", label: "Logged in" },
  UserLogout: { icon: LogOut, color: "text-zinc-400", bgColor: "bg-zinc-400/10", label: "Logged out" },
  UserRegister: { icon: UserPlus, color: "text-[#6366F1]", bgColor: "bg-[#6366F1]/10", label: "Joined" },
  TaskCreated: { icon: CheckSquare, color: "text-[#F59E0B]", bgColor: "bg-[#F59E0B]/10", label: "Created task" },
  TaskUpdated: { icon: Pencil, color: "text-[#F59E0B]", bgColor: "bg-[#F59E0B]/10", label: "Updated task" },
  TaskDeleted: { icon: Trash2, color: "text-red-400", bgColor: "bg-red-400/10", label: "Deleted task" },
  TaskMoved: { icon: ArrowRight, color: "text-[#F59E0B]", bgColor: "bg-[#F59E0B]/10", label: "Moved task" },
  DocumentCreated: { icon: FileText, color: "text-[#6366F1]", bgColor: "bg-[#6366F1]/10", label: "Created document" },
  DocumentEdited: { icon: Pencil, color: "text-[#6366F1]", bgColor: "bg-[#6366F1]/10", label: "Edited document" },
  DocumentDeleted: { icon: Trash2, color: "text-red-400", bgColor: "bg-red-400/10", label: "Deleted document" },
  RoleChanged: { icon: Shield, color: "text-[#8B5CF6]", bgColor: "bg-[#8B5CF6]/10", label: "Changed role" },
  MemberInvited: { icon: UserPlus, color: "text-[#10B981]", bgColor: "bg-[#10B981]/10", label: "Invited member" },
  MemberRemoved: { icon: Trash2, color: "text-red-400", bgColor: "bg-red-400/10", label: "Removed member" },
  FileUploaded: { icon: Upload, color: "text-[#06B6D4]", bgColor: "bg-[#06B6D4]/10", label: "Uploaded file" },
  FileDeleted: { icon: Trash2, color: "text-red-400", bgColor: "bg-red-400/10", label: "Deleted file" },
  FileMoved: { icon: FolderOpen, color: "text-[#06B6D4]", bgColor: "bg-[#06B6D4]/10", label: "Moved file" },
  CommentAdded: { icon: MessageSquare, color: "text-[#10B981]", bgColor: "bg-[#10B981]/10", label: "Commented" },
  WorkspaceCreated: { icon: Settings, color: "text-[#6366F1]", bgColor: "bg-[#6366F1]/10", label: "Created workspace" },
  WorkspaceUpdated: { icon: Settings, color: "text-zinc-400", bgColor: "bg-zinc-400/10", label: "Updated workspace" },
};

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

interface ActivityTimelineProps {
  logs: AuditLogEntry[];
}

export default memo(function ActivityTimeline({ logs }: ActivityTimelineProps) {
  const groupedLogs = useMemo(() => {
    const groups: { date: string; items: AuditLogEntry[] }[] = [];
    let currentDate = "";
    let currentGroup: AuditLogEntry[] = [];

    for (const log of logs) {
      const date = new Date(log.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      if (date !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, items: currentGroup });
        }
        currentDate = date;
        currentGroup = [log];
      } else {
        currentGroup.push(log);
      }
    }

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, items: currentGroup });
    }

    return groups;
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-zinc-700" />
        </div>
        <h3 className="text-lg font-medium text-zinc-400 mb-1">No activity yet</h3>
        <p className="text-sm text-zinc-600 max-w-sm">Activity from your workspace will appear here as a timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedLogs.map((group) => (
        <div key={group.date}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">{group.date}</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <div className="relative ml-4">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-white/5" />

            <div className="space-y-1">
              {group.items.map((log) => {
                const config = ACTION_CONFIG[log.action] || {
                  icon: File,
                  color: "text-zinc-400",
                  bgColor: "bg-zinc-400/10",
                  label: log.action,
                };
                const Icon = config.icon;

                return (
                  <div key={log.id} className="relative flex items-start gap-4 pl-6 py-2.5 group hover:bg-white/[0.02] rounded-xl transition-colors">
                    <div className="absolute left-[-5px] top-3.5 w-[11px] h-[11px] rounded-full border-2 border-[#0E0E18] bg-white/10 z-10" />

                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.bgColor}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={log.userAvatarUrl} />
                          <AvatarFallback className="bg-white/10 text-[9px] text-zinc-400">
                            {getInitials(log.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-zinc-200">{log.userName}</span>
                        <span className="text-sm text-zinc-500">{config.label.toLowerCase()}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{log.description}</p>
                    </div>

                    <span className="flex-shrink-0 text-[11px] text-zinc-600 group-hover:text-zinc-500 transition-colors whitespace-nowrap mt-0.5">
                      {formatRelativeTime(log.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
})
