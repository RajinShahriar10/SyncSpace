"use client";

import { create } from "zustand";
import type { DriveFileDto, DriveFolderDto, StorageStatsDto, FilePreviewDto } from "@/lib/drive";
import * as driveApi from "@/lib/drive";

interface DriveState {
  files: DriveFileDto[];
  folders: DriveFolderDto[];
  stats: StorageStatsDto | null;
  previewFile: FilePreviewDto | null;
  trashFiles: DriveFileDto[];
  currentPath: string;
  searchQuery: string;
  filterType: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isLoading: boolean;
  error: string | null;

  fetchFiles: (workspaceId: string, folderPath?: string) => Promise<void>;
  fetchFolders: (workspaceId: string, parentPath?: string) => Promise<void>;
  fetchStats: (workspaceId: string) => Promise<void>;
  fetchTrash: (workspaceId: string) => Promise<void>;
  openPreview: (fileId: string) => Promise<void>;
  closePreview: () => void;
  uploadFiles: (workspaceId: string, files: File[], folderPath?: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  restoreFile: (fileId: string) => Promise<void>;
  moveFile: (fileId: string, targetFolderPath: string) => Promise<void>;
  createFolder: (data: { workspaceId: string; name: string; parentPath?: string }) => Promise<void>;
  deleteFolder: (folderId: string, recursive?: boolean) => Promise<void>;
  setPath: (path: string) => void;
  setSearch: (query: string) => void;
  setFilterType: (type: string | null) => void;
}

export const useDriveStore = create<DriveState>((set, get) => ({
  files: [],
  folders: [],
  stats: null,
  previewFile: null,
  trashFiles: [],
  currentPath: "/",
  searchQuery: "",
  filterType: null,
  isUploading: false,
  uploadProgress: 0,
  isLoading: false,
  error: null,

  fetchFiles: async (workspaceId, folderPath) => {
    set({ isLoading: true });
    try {
      const { searchQuery, filterType } = get();
      const files = await driveApi.getWorkspaceFiles(workspaceId, {
        folderPath: folderPath ?? get().currentPath,
        search: searchQuery || undefined,
        fileType: filterType ?? undefined,
      });
      set({ files, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchFolders: async (workspaceId, parentPath) => {
    try {
      const folders = await driveApi.getWorkspaceFolders(workspaceId, parentPath ?? get().currentPath);
      set({ folders });
    } catch {}
  },

  fetchStats: async (workspaceId) => {
    try {
      const stats = await driveApi.getStorageStats(workspaceId);
      set({ stats });
    } catch {}
  },

  fetchTrash: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const trashFiles = await driveApi.getDeletedFiles(workspaceId);
      set({ trashFiles, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  openPreview: async (fileId) => {
    try {
      const preview = await driveApi.getFilePreview(fileId);
      set({ previewFile: preview });
    } catch {}
  },

  closePreview: () => set({ previewFile: null }),

  uploadFiles: async (workspaceId, files, folderPath) => {
    set({ isUploading: true, uploadProgress: 0 });
    try {
      for (let i = 0; i < files.length; i++) {
        await driveApi.uploadFile(workspaceId, files[i], folderPath);
        set({ uploadProgress: Math.round(((i + 1) / files.length) * 100) });
      }
      set({ isUploading: false, uploadProgress: 0 });
      await get().fetchFiles(workspaceId);
      await get().fetchStats(workspaceId);
    } catch { set({ isUploading: false, uploadProgress: 0 }); }
  },

  deleteFile: async (fileId) => {
    try {
      await driveApi.deleteFile(fileId);
      set((s) => ({ files: s.files.filter((f) => f.id !== fileId) }));
    } catch {}
  },

  restoreFile: async (fileId) => {
    try {
      await driveApi.restoreFile(fileId);
      set((s) => ({ trashFiles: s.trashFiles.filter((f) => f.id !== fileId) }));
    } catch {}
  },

  moveFile: async (fileId, targetFolderPath) => {
    try {
      await driveApi.moveFile(fileId, targetFolderPath);
      const workspaceId = get().files[0]?.workspaceId;
      if (workspaceId) await get().fetchFiles(workspaceId);
    } catch {}
  },

  createFolder: async (data) => {
    try {
      await driveApi.createFolder(data);
      await get().fetchFolders(data.workspaceId);
    } catch {}
  },

  deleteFolder: async (folderId, recursive = false) => {
    try {
      await driveApi.deleteFolder(folderId, recursive);
      const workspaceId = get().folders[0]?.workspaceId;
      if (workspaceId) await get().fetchFolders(workspaceId);
    } catch {}
  },

  setPath: (path) => set({ currentPath: path }),
  setSearch: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),
}));
