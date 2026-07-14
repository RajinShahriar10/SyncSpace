"use client";

import NextImage from "next/image";
import { useDriveStore } from "@/features/drive/stores/driveStore";
import { useAuthStore } from "@/store";
import { format } from "date-fns";
import {
  FileText, Image as ImageIcon, FileSpreadsheet, Presentation, Film, Music,
  Archive, File, Trash2, Download, Eye, Folder, FolderOpen,
  ChevronRight, ArrowLeft, Search, Filter, Grid, List
} from "lucide-react";
import { useState } from "react";

const FILE_ICONS: Record<string, any> = {
  Image: ImageIcon, Pdf: FileText, Document: FileText, Spreadsheet: FileSpreadsheet,
  Presentation: Presentation, Video: Film, Audio: Music, Archive: Archive, Other: File
};

const FILE_COLORS: Record<string, string> = {
  Image: "text-emerald-400", Pdf: "text-red-400", Document: "text-blue-400",
  Spreadsheet: "text-green-400", Presentation: "text-orange-400", Video: "text-purple-400",
  Audio: "text-pink-400", Archive: "text-yellow-400", Other: "text-zinc-400"
};

export default function FileBrowser({ workspaceId }: { workspaceId: string }) {
  const { files, folders, currentPath, searchQuery, isLoading, setPath, setSearch, openPreview, deleteFile } = useDriveStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const pathParts = currentPath.split("/").filter(Boolean);

  const navigateUp = () => {
    const parent = pathParts.slice(0, -1).join("/");
    setPath(parent ? `/${parent}/` : "/");
  };

  const navigateToFolder = (path: string) => setPath(path);

  return (
    <div>
      {/* Breadcrumb + Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 text-sm">
          <button onClick={() => setPath("/")} className={`px-2 py-1 rounded transition-colors ${currentPath === "/" ? "bg-[#6366F1]/20 text-[#A5B4FC]" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
            <FolderOpen className="w-3.5 h-3.5 inline mr-1" />Root
          </button>
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center">
              <ChevronRight className="w-3 h-3 text-zinc-600 mx-0.5" />
              <button
                onClick={() => setPath(`/${pathParts.slice(0, i + 1).join("/")}/`)}
                className={`px-2 py-1 rounded transition-colors ${i === pathParts.length - 1 ? "bg-[#6366F1]/20 text-[#A5B4FC]" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
              >
                {part}
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="pl-7 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-zinc-300 placeholder-zinc-500 focus:border-[#6366F1]/50 focus:outline-none"
            />
          </div>
          <button onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white">
            {viewMode === "list" ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-zinc-500 uppercase mb-2 px-1">Folders</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => navigateToFolder(folder.path)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <Folder className="w-4 h-4 text-[#6366F1] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-300 truncate">{folder.name}</p>
                  <p className="text-[10px] text-zinc-500">{folder.fileCount} files</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {files.length === 0 && !isLoading ? (
        <div className="text-center py-12 text-zinc-500">
          <File className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
          <p className="text-sm">No files in this folder</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-0.5">
          {files.map((file) => {
            const Icon = FILE_ICONS[file.fileType] || File;
            const color = FILE_COLORS[file.fileType] || "text-zinc-400";
            return (
              <div key={file.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 group transition-colors">
                {file.thumbnailUrl && file.fileType === "Image" ? (
                  <NextImage src={file.thumbnailUrl} alt="" width={32} height={32} unoptimized className="w-8 h-8 rounded object-cover" />
                ) : (
                  <Icon className={`w-8 h-8 p-1.5 rounded-lg bg-white/5 ${color}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 truncate">{file.filename}</p>
                  <p className="text-[10px] text-zinc-500">
                    {file.uploadedByName} &middot; {formatSize(file.size)} &middot; {format(new Date(file.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openPreview(file.id)} className="p-1.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white" title="Preview">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <a href={file.url} download={file.filename} className="p-1.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white" title="Download">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => deleteFile(file.id)} className="p-1.5 rounded hover:bg-white/10 text-zinc-500 hover:text-red-400" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {files.map((file) => {
            const Icon = FILE_ICONS[file.fileType] || File;
            const color = FILE_COLORS[file.fileType] || "text-zinc-400";
            return (
              <button
                key={file.id}
                onClick={() => openPreview(file.id)}
                className="flex flex-col items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all group"
              >
                {file.thumbnailUrl && file.fileType === "Image" ? (
                  <NextImage src={file.thumbnailUrl} alt="" width={200} height={96} unoptimized className="w-full h-24 rounded-lg object-cover mb-2" />
                ) : (
                  <Icon className={`w-10 h-10 p-2 rounded-xl bg-white/5 mb-2 ${color}`} />
                )}
                <p className="text-xs text-zinc-300 truncate w-full text-center">{file.filename}</p>
                <p className="text-[10px] text-zinc-500">{formatSize(file.size)}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
