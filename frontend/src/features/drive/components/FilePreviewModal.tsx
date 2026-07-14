"use client";

import Image from "next/image";
import { useDriveStore } from "@/features/drive/stores/driveStore";
import { X, Download, Trash2, ExternalLink } from "lucide-react";

export default function FilePreviewModal() {
  const { previewFile, closePreview } = useDriveStore();
  if (!previewFile) return null;

  const { file, previewUrl, canDelete } = previewFile;
  const isImage = file.fileType === "Image";
  const isPdf = file.mimeType === "application/pdf";

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={closePreview}>
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#12121A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h3 className="text-sm font-medium text-zinc-200 truncate max-w-md">{file.filename}</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {formatSize(file.size)} &middot; {file.uploadedByName} &middot; {file.mimeType}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white" title="Open in new tab">
              <ExternalLink className="w-4 h-4" />
            </a>
            <a href={file.url} download={file.filename} className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white" title="Download">
              <Download className="w-4 h-4" />
            </a>
            <button onClick={closePreview} className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex items-center justify-center overflow-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {isImage ? (
            <Image src={previewUrl} alt={file.filename} width={1200} height={800} unoptimized className="max-w-full max-h-[70vh] object-contain p-4" />
          ) : isPdf ? (
            <iframe src={previewUrl} className="w-full h-[70vh] border-0" title={file.filename} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <p className="text-sm mb-2">Preview not available for this file type</p>
              <a href={file.url} download={file.filename} className="text-sm text-[#6366F1] hover:text-[#818CF8]">
                Download to view
              </a>
            </div>
          )}
        </div>

        {/* Description/Tags */}
        {(file.description || file.tags) && (
          <div className="px-6 py-3 border-t border-white/5">
            {file.description && <p className="text-xs text-zinc-400">{file.description}</p>}
            {file.tags && (
              <div className="flex flex-wrap gap-1 mt-1">
                {file.tags.split(",").map((t, i) => (
                  <span key={i} className="px-2 py-0.5 text-[10px] bg-white/5 text-zinc-400 rounded-full">{t.trim()}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
