"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TimelinePoint } from "@/lib/analytics";

interface MessagesTimelineChartProps {
  data: TimelinePoint[];
}

export default function MessagesTimelineChart({ data }: MessagesTimelineChartProps) {
  if (!data.length) {
    return (
      <div className="glass rounded-2xl border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4">Messages Sent</h3>
        <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">No data yet</div>
      </div>
    );
  }

  const formatted = data.map((d) => ({ ...d, label: d.label.slice(5) }));

  return (
    <div className="glass rounded-2xl border border-white/5 p-6">
      <h3 className="text-sm font-semibold text-zinc-200 mb-4">Messages Sent</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradLineMsg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
            formatter={(value) => [`${value} msgs`, "Sent"]}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#06B6D4"
            strokeWidth={2.5}
            dot={{ fill: "#06B6D4", r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "#1a1a2e" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
