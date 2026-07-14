"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TimelinePoint } from "@/lib/analytics";

interface DocumentsTimelineChartProps {
  data: TimelinePoint[];
}

export default function DocumentsTimelineChart({ data }: DocumentsTimelineChartProps) {
  if (!data.length) {
    return (
      <div className="glass rounded-2xl border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4">Documents Created</h3>
        <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">No data yet</div>
      </div>
    );
  }

  const formatted = data.map((d) => ({ ...d, label: d.label.slice(5) }));

  return (
    <div className="glass rounded-2xl border border-white/5 p-6">
      <h3 className="text-sm font-semibold text-zinc-200 mb-4">Documents Created</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
            formatter={(value) => [`${value} docs`, "Created"]}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
