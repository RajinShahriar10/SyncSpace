"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useDriveStore } from "@/features/drive/stores/driveStore";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import FileUpload from "@/features/drive/components/FileUpload";
import FileBrowser from "@/features/drive/components/FileBrowser";
import FilePreviewModal from "@/features/drive/components/FilePreviewModal";
import StorageStats from "@/features/drive/components/StorageStats";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FolderPlus, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function FilesPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace, fetchWorkspace } = useWorkspaceStore();
  const {
    folders, currentPath, isLoading, fetchFiles, fetchFolders, fetchStats,
    setPath, createFolder
  } = useDriveStore();
  const [showUpload, setShowUpload] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    fetchWorkspace(workspaceId);
  }, [workspaceId, fetchWorkspace]);

  useEffect(() => {
    fetchFiles(workspaceId);
    fetchFolders(workspaceId);
    fetchStats(workspaceId);
  }, [workspaceId, currentPath, fetchFiles, fetchFolders, fetchStats]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder({ workspaceId, name: newFolderName.trim(), parentPath: currentPath });
    setNewFolderName("");
    setShowNewFolder(false);
    await fetchFolders(workspaceId);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.push(`/workspaces/${workspaceId}`)}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5">
                <FolderPlus className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Files</h1>
                <p className="text-sm text-muted-foreground">
                  {currentWorkspace?.name} &middot; Manage project files
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentPath !== "/" && (
                <Button variant="ghost" size="sm" onClick={() => {
                  const parts = currentPath.split("/").filter(Boolean);
                  setPath(parts.length > 1 ? `/${parts.slice(0, -1).join("/")}/` : "/");
                }} className="gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowNewFolder(!showNewFolder)} className="gap-1">
                <FolderPlus className="h-3.5 w-3.5" /> New folder
              </Button>
              <Button size="sm" onClick={() => setShowUpload(!showUpload)} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Upload
              </Button>
            </div>
          </div>
        </motion.div>

        {showNewFolder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="h-9 text-sm max-w-xs"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleCreateFolder} className="h-9">Create</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewFolder(false)} className="h-9">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <FileUpload workspaceId={workspaceId} folderPath={currentPath} />
          </motion.div>
        )}

        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <FileBrowser workspaceId={workspaceId} />
            )}
          </div>
          <div className="w-64 shrink-0 hidden lg:block">
            <StorageStats />
          </div>
        </div>
      </div>

      <FilePreviewModal />
    </DashboardLayout>
  );
}
