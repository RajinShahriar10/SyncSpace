"use client";

import { useEffect } from "react";
import { HardDrive, Loader2 } from "lucide-react";
import { useAdminStore } from "@/features/admin/stores/adminStore";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function AdminStoragePage() {
  const { storage, isLoading, fetchStorage } = useAdminStore();

  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  const maxWorkspaceSize = Math.max(...(storage?.byWorkspace.map((w) => w.sizeBytes) ?? [1]), 1);
  const maxTypeSize = Math.max(...(storage?.byType.map((t) => t.sizeBytes) ?? [1]), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-4 sm:px-0">
        <div className="p-2 rounded-xl bg-[#6366F1]/10">
          <HardDrive className="w-5 h-5 text-[#6366F1]" />
        </div>
        <div>
          <h1 className="text-zinc-200 font-semibold text-lg">Storage</h1>
          <p className="text-sm text-zinc-500">Monitor storage usage across the platform</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        </div>
      ) : storage ? (
        <div className="space-y-6">
          <div className="glass rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Total Storage Used</p>
                <p className="text-3xl text-zinc-200 font-semibold mt-1">
                  {formatBytes(storage.totalStorageBytes)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-500">Total Files</p>
                <p className="text-3xl text-zinc-200 font-semibold mt-1">
                  {storage.totalFiles.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl border border-white/5 p-5 space-y-4">
            <h2 className="text-zinc-200 font-semibold">By Workspace</h2>
            <div className="space-y-3">
              {storage.byWorkspace.map((item) => (
                <div key={item.workspaceName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{item.workspaceName}</span>
                    <span className="text-zinc-500">
                      {item.fileCount} files · {formatBytes(item.sizeBytes)}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6366F1] rounded-full transition-all"
                      style={{ width: `${(item.sizeBytes / maxWorkspaceSize) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {storage.byWorkspace.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-4">No workspace data available</p>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl border border-white/5 p-5 space-y-4">
            <h2 className="text-zinc-200 font-semibold">By File Type</h2>
            <div className="space-y-3">
              {storage.byType.map((item) => (
                <div key={item.fileType} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{item.fileType}</span>
                    <span className="text-zinc-500">
                      {item.fileCount} files · {formatBytes(item.sizeBytes)}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6366F1] rounded-full transition-all"
                      style={{ width: `${(item.sizeBytes / maxTypeSize) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {storage.byType.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-4">No file type data available</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
