"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import { useDriveStore } from "@/features/drive/stores/driveStore";
import FileUpload from "@/features/drive/components/FileUpload";
import FileBrowser from "@/features/drive/components/FileBrowser";
import FilePreviewModal from "@/features/drive/components/FilePreviewModal";
import {
  Plus, FileText, Clock, User, Trash2, Upload, FolderOpen,
  File, Image, Download, Eye
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const FILE_TYPE_COLORS: Record<string, string> = {
  Image: "text-emerald-400",
  Pdf: "text-red-400",
  Document: "text-blue-400",
  Spreadsheet: "text-green-400",
  Presentation: "text-orange-400",
  Video: "text-purple-400",
  Other: "text-zinc-400",
};

export default function WorkspaceDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const { documents, fetchWorkspaceDocuments, isLoading: docsLoading, createDocument, deleteDocument } =
    useDocumentStore();
  const { currentWorkspace, fetchWorkspace } = useWorkspaceStore();
  const {
    files, folders, isLoading: filesLoading, uploadProgress, isUploading,
    fetchFiles, fetchFolders, fetchStats, uploadFiles, deleteFile, openPreview,
  } = useDriveStore();

  const [tab, setTab] = useState<"documents" | "files">("documents");
  const [creating, setCreating] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchWorkspaceDocuments(workspaceId);
    if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
      fetchWorkspace(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceDocuments, fetchWorkspace, currentWorkspace]);

  useEffect(() => {
    if (tab === "files") {
      fetchFiles(workspaceId);
      fetchFolders(workspaceId);
      fetchStats(workspaceId);
    }
  }, [tab, workspaceId, fetchFiles, fetchFolders, fetchStats]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const doc = await createDocument({ workspaceId, title: "Untitled" });
      router.push(`/documents/${doc.id}`);
    } catch {
      setCreating(false);
    }
  };

  const handleUploadComplete = useCallback(() => {
    fetchFiles(workspaceId);
    fetchStats(workspaceId);
    setShowUpload(false);
  }, [workspaceId, fetchFiles, fetchStats]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              {currentWorkspace?.name} &middot; {documents.length} docs &middot; {files.length} files
            </p>
          </div>
          <div className="flex gap-2">
            {tab === "documents" && (
              <Button onClick={handleCreate} disabled={creating} className="gap-2">
                <Plus className="h-4 w-4" />
                {creating ? "Creating..." : "New Document"}
              </Button>
            )}
            {tab === "files" && (
              <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </Button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl w-fit">
          <button
            onClick={() => setTab("documents")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === "documents"
                ? "bg-[#6366F1]/20 text-[#A5B4FC]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText className="h-4 w-4" />
            Collaborative Docs
            <span className="text-xs text-zinc-500">({documents.length})</span>
          </button>
          <button
            onClick={() => setTab("files")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === "files"
                ? "bg-[#6366F1]/20 text-[#A5B4FC]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Uploaded Files
            <span className="text-xs text-zinc-500">({files.length})</span>
          </button>
        </div>

        {/* Upload Zone */}
        {tab === "files" && showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <FileUpload workspaceId={workspaceId} />
          </motion.div>
        )}

        {/* Documents Tab */}
        {tab === "documents" && (
          <>
            {docsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : documents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] py-20"
              >
                <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <h3 className="text-lg font-medium">No documents yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first document to get started.
                </p>
                <Button onClick={handleCreate} disabled={creating} className="mt-6 gap-2">
                  <Plus className="h-4 w-4" />
                  Create Document
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card
                      className="group cursor-pointer transition-all hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5"
                      onClick={() => router.push(`/documents/${doc.id}`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base font-medium line-clamp-1">
                            {doc.title || "Untitled"}
                          </CardTitle>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this document?")) {
                                deleteDocument(doc.id);
                              }
                            }}
                            className="rounded-lg p-1 text-muted-foreground opacity-0 transition-all hover:bg-white/[0.06] hover:text-red-400 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-2 text-sm text-muted-foreground/70">
                          {doc.content?.slice(0, 150) || "Empty document"}
                        </p>
                        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground/50">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {doc.authorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Files Tab */}
        {tab === "files" && (
          <>
            {filesLoading && files.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : files.length === 0 && !showUpload ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] py-20"
              >
                <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <h3 className="text-lg font-medium">No files uploaded yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload documents, images, PDFs, and more.
                </p>
                <Button onClick={() => setShowUpload(true)} className="mt-6 gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Files
                </Button>
              </motion.div>
            ) : (
              <FileBrowser workspaceId={workspaceId} />
            )}
          </>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#12121A] border border-white/10 rounded-xl p-4 shadow-2xl min-w-[280px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
              <span className="text-sm text-zinc-300">Uploading... {uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6366F1] rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Preview Modal */}
        <FilePreviewModal />
      </div>
    </DashboardLayout>
  );
}
