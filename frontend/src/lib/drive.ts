import api from "./api";

export interface DriveFileDto {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  fileType: string;
  folderPath?: string;
  workspaceId: string;
  uploadedById: string;
  uploadedByName: string;
  description?: string;
  tags?: string;
  createdAt: string;
}

export interface DriveFolderDto {
  id: string;
  name: string;
  path: string;
  parentPath?: string;
  workspaceId: string;
  fileCount: number;
  totalSize: number;
  createdAt: string;
}

export interface StorageStatsDto {
  totalSize: number;
  totalFiles: number;
  totalFolders: number;
  usedStorage: number;
  freeStorage: number;
  sizeByType: Record<string, number>;
  countByType: Record<string, number>;
  recentFiles: DriveFileDto[];
}

export interface FilePreviewDto {
  file: DriveFileDto;
  previewUrl: string;
  canEdit: boolean;
  canDelete: boolean;
}

// --- Files ---

export async function getWorkspaceFiles(
  workspaceId: string,
  params?: { folderPath?: string; search?: string; fileType?: string; page?: number; pageSize?: number }
): Promise<DriveFileDto[]> {
  const q = new URLSearchParams();
  if (params?.folderPath) q.set("folderPath", params.folderPath);
  if (params?.search) q.set("search", params.search);
  if (params?.fileType) q.set("fileType", params.fileType);
  if (params?.page) q.set("page", params.page.toString());
  if (params?.pageSize) q.set("pageSize", params.pageSize.toString());
  const res = await api.get<{ data: DriveFileDto[] }>(`/file/workspace/${workspaceId}?${q}`);
  return res.data.data;
}

export async function getFile(fileId: string): Promise<DriveFileDto> {
  const res = await api.get<{ data: DriveFileDto }>(`/file/${fileId}`);
  return res.data.data;
}

export async function getFilePreview(fileId: string): Promise<FilePreviewDto> {
  const res = await api.get<{ data: FilePreviewDto }>(`/file/${fileId}/preview`);
  return res.data.data;
}

export async function uploadFile(
  workspaceId: string,
  file: File,
  folderPath?: string,
  description?: string,
  tags?: string
): Promise<DriveFileDto> {
  const formData = new FormData();
  formData.append("file", file);
  const q = new URLSearchParams({ workspaceId });
  if (folderPath) q.set("folderPath", folderPath);
  if (description) q.set("description", description);
  if (tags) q.set("tags", tags);
  const res = await api.post<{ data: DriveFileDto }>(`/file/upload?${q}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function updateFile(fileId: string, data: { description?: string; tags?: string; folderPath?: string }): Promise<DriveFileDto> {
  const res = await api.put<{ data: DriveFileDto }>(`/file/${fileId}`, data);
  return res.data.data;
}

export async function deleteFile(fileId: string): Promise<void> {
  await api.delete(`/file/${fileId}`);
}

export async function restoreFile(fileId: string): Promise<DriveFileDto> {
  const res = await api.post<{ data: DriveFileDto }>(`/file/${fileId}/restore`);
  return res.data.data;
}

export async function moveFile(fileId: string, targetFolderPath: string): Promise<DriveFileDto> {
  const res = await api.post<{ data: DriveFileDto }>(`/file/${fileId}/move?targetFolderPath=${encodeURIComponent(targetFolderPath)}`);
  return res.data.data;
}

// --- Folders ---

export async function getWorkspaceFolders(workspaceId: string, parentPath?: string): Promise<DriveFolderDto[]> {
  const q = parentPath ? `?parentPath=${encodeURIComponent(parentPath)}` : "";
  const res = await api.get<{ data: DriveFolderDto[] }>(`/file/folders/${workspaceId}${q}`);
  return res.data.data;
}

export async function createFolder(data: { workspaceId: string; name: string; parentPath?: string }): Promise<DriveFolderDto> {
  const res = await api.post<{ data: DriveFolderDto }>("/file/folders", data);
  return res.data.data;
}

export async function deleteFolder(folderId: string, recursive = false): Promise<void> {
  await api.delete(`/file/folders/${folderId}?recursive=${recursive}`);
}

// --- Stats ---

export async function getStorageStats(workspaceId: string): Promise<StorageStatsDto> {
  const res = await api.get<{ data: StorageStatsDto }>(`/file/stats/${workspaceId}`);
  return res.data.data;
}

export async function getDeletedFiles(workspaceId: string): Promise<DriveFileDto[]> {
  const res = await api.get<{ data: DriveFileDto[] }>(`/file/trash/${workspaceId}`);
  return res.data.data;
}
