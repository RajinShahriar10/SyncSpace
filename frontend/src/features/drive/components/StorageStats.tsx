"use client";

import { useDriveStore } from "@/features/drive/stores/driveStore";
import { HardDrive, FileText, FolderOpen } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  Image: "bg-emerald-500", Pdf: "bg-red-500", Document: "bg-blue-500",
  Spreadsheet: "bg-green-500", Presentation: "bg-orange-500", Video: "bg-purple-500",
  Audio: "bg-pink-500", Archive: "bg-yellow-500", Other: "bg-zinc-500"
};

export default function StorageStats() {
  const { stats } = useDriveStore();
  if (!stats) return null;

  const totalSize = stats.totalSize || 1;
  const maxStorage = 10 * 1024 * 1024 * 1024; // 10 GB
  const usedPercent = Math.min(100, (stats.usedStorage / maxStorage) * 100);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const typeEntries = Object.entries(stats.countByType).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
      <h3 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-1.5">
        <HardDrive className="w-3.5 h-3.5" /> Storage
      </h3>

      {/* Usage bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
          <span>{formatSize(stats.usedStorage)} used</span>
          <span>{formatSize(maxStorage)} total</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${usedPercent}%`,
              background: `linear-gradient(90deg, #6366F1, ${usedPercent > 80 ? "#EF4444" : "#8B5CF6"})`
            }}
          />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg">
          <FileText className="w-3.5 h-3.5 text-[#6366F1]" />
          <div>
            <p className="text-xs font-medium text-zinc-300">{stats.totalFiles}</p>
            <p className="text-[9px] text-zinc-500">Files</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg">
          <FolderOpen className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <div>
            <p className="text-xs font-medium text-zinc-300">{stats.totalFolders}</p>
            <p className="text-[9px] text-zinc-500">Folders</p>
          </div>
        </div>
      </div>

      {/* Type breakdown */}
      {typeEntries.length > 0 && (
        <div>
          <p className="text-[10px] text-zinc-500 uppercase mb-2">By type</p>
          <div className="space-y-1.5">
            {typeEntries.map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[type] || "bg-zinc-500"}`} />
                <span className="text-[11px] text-zinc-400 flex-1">{type}</span>
                <span className="text-[11px] text-zinc-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
