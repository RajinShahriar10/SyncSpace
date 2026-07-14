"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw, X, Clock, FileText } from "lucide-react";

interface VersionHistoryPanelProps {
  documentId: string;
  onClose: () => void;
}

export function VersionHistoryPanel({ documentId, onClose }: VersionHistoryPanelProps) {
  const { versions, fetchVersions, restoreVersion, currentDocument } = useDocumentStore();

  useEffect(() => {
    fetchVersions(documentId);
  }, [documentId, fetchVersions]);

  return (
    <div className="flex h-full w-80 flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Version History</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-auto p-2">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="mb-3 h-8 w-8 opacity-50" />
            <p className="text-sm">No versions yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {versions.map((version, i) => {
              const isCurrent = currentDocument?.currentVersion === version.versionNumber;
              const isLatest = i === 0;

              return (
                <motion.div
                  key={version.versionNumber}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`group rounded-lg px-3 py-2.5 transition-colors ${
                    isCurrent
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${
                          isCurrent ? "text-primary" : "text-foreground"
                        }`}>
                          v{version.versionNumber}
                        </span>
                        {isLatest && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            Latest
                          </span>
                        )}
                        {isCurrent && (
                          <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                            Current
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {version.changeDescription || version.title || "No description"}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/60">
                        <span>{version.authorName || "Unknown"}</span>
                        <span>&middot;</span>
                        <span>
                          {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => restoreVersion(documentId, version.versionNumber)}
                        className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-white/[0.06] hover:text-foreground group-hover:opacity-100"
                        title="Restore this version"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
