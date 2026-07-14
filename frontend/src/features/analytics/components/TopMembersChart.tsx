"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TopMember } from "@/lib/analytics";

const COLORS = ["#6366F1", "#8B5CF6", "#F59E0B", "#10B981", "#06B6D4", "#F43F5E", "#EC4899", "#14B8A6", "#A855F7", "#3B82F6"];

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

interface TopMembersChartProps {
  data: TopMember[];
}

export default function TopMembersChart({ data }: TopMembersChartProps) {
  if (!data.length) {
    return (
      <div className="glass rounded-2xl border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4">Most Active Members</h3>
        <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">No members yet</div>
      </div>
    );
  }

  const chartData = data.slice(0, 8).map((m) => ({
    name: m.fullName.split(" ")[0],
    tasks: m.taskCount,
    docs: m.documentCount,
    msgs: m.messageCount,
    total: m.totalActivity,
  }));

  return (
    <div className="glass rounded-2xl border border-white/5 p-6">
      <h3 className="text-sm font-semibold text-zinc-200 mb-4">Most Active Members</h3>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {data.slice(0, 6).map((m) => (
          <div key={m.userId} className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={m.avatarUrl} />
              <AvatarFallback className="bg-white/10 text-[9px] text-zinc-400">{getInitials(m.fullName)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-zinc-400">{m.fullName.split(" ")[0]}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip
            contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
            formatter={(value, name) => {
              const label = name === "tasks" ? "Tasks" : name === "docs" ? "Docs" : "Messages";
              return [value, label];
            }}
          />
          <Bar dataKey="tasks" stackId="a" fill="#6366F1" radius={[0, 0, 0, 0]} maxBarSize={24} />
          <Bar dataKey="docs" stackId="a" fill="#8B5CF6" radius={[0, 0, 0, 0]} maxBarSize={24} />
          <Bar dataKey="msgs" stackId="a" fill="#06B6D4" radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
