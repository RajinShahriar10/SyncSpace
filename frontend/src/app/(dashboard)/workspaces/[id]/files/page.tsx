"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDriveStore } from "@/features/drive/stores/driveStore";
import FileUpload from "@/features/drive/components/FileUpload";
import FileBrowser from "@/features/drive/components/FileBrowser";
import FilePreviewModal from "@/features/drive/components/FilePreviewModal";
import StorageStats from "@/features/drive/components/StorageStats";
import { FolderPlus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FilesPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const {
    folders, currentPath, isLoading, fetchFiles, fetchFolders, fetchStats,
    setPath, createFolder
  } = useDriveStore();
  const [showUpload, setShowUpload] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);

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
    <div className="min-h-full bg-[#0D0D14] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-200">Files</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Manage your workspace files and documents</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {currentPath !== "/" && (
              <Button variant="ghost" size="sm" onClick={() => {
                const parts = currentPath.split("/").filter(Boolean);
                setPath(parts.length > 1 ? `/${parts.slice(0, -1).join("/")}/` : "/");
              }} className="text-zinc-400">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowNewFolder(!showNewFolder)} className="text-zinc-400">
              <FolderPlus className="w-3.5 h-3.5 mr-1" /> New folder
            </Button>
            <Button size="sm" onClick={() => setShowUpload(!showUpload)} className="bg-[#6366F1] hover:bg-[#5558E6]">
              <Plus className="w-3.5 h-3.5 mr-1" /> Upload
            </Button>
          </div>
        </div>

        {/* New folder input */}
        {showNewFolder && (
          <div className="flex gap-2 mb-4">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="h-8 text-xs bg-white/5 border-white/10 max-w-xs"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
            <Button size="sm" onClick={handleCreateFolder} className="h-8 bg-[#6366F1] hover:bg-[#5558E6]">Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNewFolder(false)} className="h-8 text-zinc-400">Cancel</Button>
          </div>
        )}

        {/* Upload */}
        {showUpload && (
          <div className="mb-6">
            <FileUpload workspaceId={workspaceId} folderPath={currentPath} />
          </div>
        )}

        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <FileBrowser workspaceId={workspaceId} />
            )}
          </div>

          {/* Sidebar stats */}
          <div className="w-64 shrink-0 hidden lg:block">
            <StorageStats />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <FilePreviewModal />
    </div>
  );
}
