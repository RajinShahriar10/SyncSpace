"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { WorkspaceGrowth } from "@/lib/analytics";

const COLORS = {
  members: "#6366F1",
  documents: "#8B5CF6",
  tasks: "#F59E0B",
  messages: "#06B6D4",
};

interface WorkspaceGrowthChartProps {
  data: WorkspaceGrowth[];
}

export default function WorkspaceGrowthChart({ data }: WorkspaceGrowthChartProps) {
  if (!data.length) {
    return (
      <div className="glass rounded-2xl border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4">Workspace Growth</h3>
        <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">No data yet</div>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: d.label.slice(5),
  }));

  return (
    <div className="glass rounded-2xl border border-white/5 p-6">
      <h3 className="text-sm font-semibold text-zinc-200 mb-4">Workspace Growth</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradMembers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.members} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.members} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDocs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.documents} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.documents} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradTasks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.tasks} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.tasks} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradMessages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.messages} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.messages} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
          <Area type="monotone" dataKey="members" stroke={COLORS.members} fill="url(#gradMembers)" strokeWidth={2} />
          <Area type="monotone" dataKey="documents" stroke={COLORS.documents} fill="url(#gradDocs)" strokeWidth={2} />
          <Area type="monotone" dataKey="tasks" stroke={COLORS.tasks} fill="url(#gradTasks)" strokeWidth={2} />
          <Area type="monotone" dataKey="messages" stroke={COLORS.messages} fill="url(#gradMessages)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
