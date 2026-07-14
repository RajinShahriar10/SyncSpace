"use client";

import { useEffect } from "react";
import { HeartPulse, Loader2 } from "lucide-react";
import { useAdminStore } from "@/features/admin/stores/adminStore";

const statusColors: Record<string, string> = {
  healthy: "bg-[#10B981]/10 text-[#10B981]",
  degraded: "bg-yellow-400/10 text-yellow-400",
  down: "bg-red-400/10 text-red-400",
};

export default function AdminHealthPage() {
  const { health, isLoading, fetchHealth } = useAdminStore();

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-4 sm:px-0">
        <div className="p-2 rounded-xl bg-[#6366F1]/10">
          <HeartPulse className="w-5 h-5 text-[#6366F1]" />
        </div>
        <div>
          <h1 className="text-zinc-200 font-semibold text-lg">System Health</h1>
          <p className="text-sm text-zinc-500">Monitor system status and health checks</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        </div>
      ) : health ? (
        <div className="space-y-6">
          <div className="glass rounded-2xl border border-white/5 p-5 flex items-center gap-4">
            <span
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                statusColors[health.status] ?? "bg-zinc-400/10 text-zinc-400"
              }`}
            >
              {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
            </span>
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  health.databaseConnected ? "bg-[#10B981]" : "bg-red-400"
                }`}
              />
              <span className="text-sm text-zinc-400">
                Database {health.databaseConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Runtime Version", value: health.runtimeVersion },
              { label: "Server Time", value: new Date(health.serverTime).toLocaleString() },
              { label: "Memory", value: `${health.processMemoryMB} MB` },
              { label: "Threads", value: health.threadCount },
              { label: "Uptime", value: `${health.uptimeDays} days` },
              { label: "DB Response", value: `${health.databaseResponseMs} ms` },
            ].map((item) => (
              <div key={item.label} className="glass rounded-2xl border border-white/5 p-5">
                <p className="text-sm text-zinc-500">{item.label}</p>
                <p className="text-lg text-zinc-200 font-semibold mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          {health.checks && Object.keys(health.checks).length > 0 && (
            <div className="glass rounded-2xl border border-white/5 p-5 space-y-4">
              <h2 className="text-zinc-200 font-semibold">Health Checks</h2>
              <div className="space-y-2">
                {Object.entries(health.checks).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="text-sm text-zinc-400">{key}</span>
                    <span className="text-sm text-zinc-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
