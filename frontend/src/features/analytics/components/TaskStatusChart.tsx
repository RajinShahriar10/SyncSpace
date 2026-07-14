"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { TaskStatus } from "@/lib/analytics";

const COLORS = ["#6366F1", "#8B5CF6", "#F59E0B", "#10B981", "#06B6D4", "#F43F5E", "#EC4899", "#14B8A6"];

interface TaskStatusChartProps {
  data: TaskStatus[];
}

export default function TaskStatusChart({ data }: TaskStatusChartProps) {
  if (!data.length) {
    return (
      <div className="glass rounded-2xl border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4">Task Distribution</h3>
        <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">No tasks yet</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/5 p-6">
      <h3 className="text-sm font-semibold text-zinc-200 mb-4">Task Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="count"
            nameKey="columnName"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
            formatter={(value, name) => [`${value} tasks`, name]}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
