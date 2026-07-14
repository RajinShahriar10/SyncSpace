"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, Image, File } from "lucide-react";
import { useDriveStore } from "@/features/drive/stores/driveStore";
import { Button } from "@/components/ui/button";

interface Props {
  workspaceId: string;
  folderPath?: string;
}

export default function FileUpload({ workspaceId, folderPath }: Props) {
  const { isUploading, uploadProgress, uploadFiles } = useDriveStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((fileList: FileList) => {
    setPendingFiles(Array.from(fileList));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    await uploadFiles(workspaceId, pendingFiles, folderPath);
    setPendingFiles([]);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4 text-emerald-400" />;
    if (type.includes("pdf")) return <FileText className="w-4 h-4 text-red-400" />;
    return <File className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragOver ? "border-[#6366F1] bg-[#6366F1]/10" : "border-white/10 hover:border-white/20 bg-white/[0.02]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <Upload className="w-8 h-8 mx-auto mb-3 text-zinc-500" />
        <p className="text-sm text-zinc-300 mb-1">
          {isDragOver ? "Drop files here" : "Drag & drop files or click to browse"}
        </p>
        <p className="text-xs text-zinc-500">Supports images, PDFs, documents up to 100 MB</p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
              {getFileIcon(f.type)}
              <span className="text-sm text-zinc-300 truncate flex-1">{f.name}</span>
              <span className="text-xs text-zinc-500">{formatSize(f.size)}</span>
              <button onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))} className="text-zinc-500 hover:text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={isUploading} className="bg-[#6366F1] hover:bg-[#5558E6]">
              {isUploading ? `Uploading... ${uploadProgress}%` : `Upload ${pendingFiles.length} file(s)`}
            </Button>
            <Button variant="ghost" onClick={() => setPendingFiles([])} className="text-zinc-400">Cancel</Button>
          </div>
          {isUploading && (
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#6366F1] rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
