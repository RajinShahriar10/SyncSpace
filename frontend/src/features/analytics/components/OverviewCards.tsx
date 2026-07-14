"use client";

import { Users, FileText, CheckSquare, MessageSquare, HardDrive, TrendingUp, UserCheck, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { WorkspaceOverview } from "@/lib/analytics";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return size.toFixed(1) + " " + units[i];
}

const cards = [
  { key: "activeUsers" as const, label: "Active Users (30d)", icon: UserCheck, color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
  { key: "totalMembers" as const, label: "Total Members", icon: Users, color: "text-[#6366F1]", bg: "bg-[#6366F1]/10" },
  { key: "totalDocuments" as const, label: "Documents", icon: FileText, color: "text-[#8B5CF6]", bg: "bg-[#8B5CF6]/10" },
  { key: "totalTasks" as const, label: "Total Tasks", icon: CheckSquare, color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
  { key: "totalMessages" as const, label: "Messages", icon: MessageSquare, color: "text-[#06B6D4]", bg: "bg-[#06B6D4]/10" },
  { key: "taskCompletionRate" as const, label: "Task Completion", icon: TrendingUp, color: "text-[#10B981]", bg: "bg-[#10B981]/10", suffix: "%" },
  { key: "totalFiles" as const, label: "Files", icon: HardDrive, color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
  { key: "activeUsersLast7Days" as const, label: "Active (7d)", icon: BarChart3, color: "text-[#6366F1]", bg: "bg-[#6366F1]/10" },
];

interface OverviewCardsProps {
  overview: WorkspaceOverview | null;
}

export default function OverviewCards({ overview }: OverviewCardsProps) {
  if (!overview) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        const value = overview[c.key];
        return (
          <div key={c.key} className="glass rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
                <Icon className={`w-4.5 h-4.5 ${c.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-zinc-100">
              {c.suffix ? value.toFixed(1) : value.toLocaleString()}
              {c.suffix && <span className="text-sm font-normal text-zinc-500 ml-0.5">{c.suffix}</span>}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{c.label}</p>
          </div>
        );
      })}
    </div>
  );
}
