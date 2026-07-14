import api from "./api";

export interface DocumentDto {
  id: string;
  title: string;
  content: string;
  workspaceId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  isPublished: boolean;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionDto {
  versionNumber: number;
  title: string;
  changeDescription?: string;
  authorName?: string;
  createdAt: string;
}

export interface CommentDto {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  positionStart?: number;
  positionEnd?: number;
  selectedText?: string;
  isResolved: boolean;
  parentCommentId?: string;
  createdAt: string;
  replies: CommentDto[];
  reactions: ReactionDto[];
}

export interface ReactionDto {
  emoji: string;
  userId: string;
  userName: string;
  count: number;
}

export interface CreateDocumentRequest {
  workspaceId: string;
  title?: string;
  content?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
}

export interface AddCommentRequest {
  content: string;
  positionStart?: number;
  positionEnd?: number;
  selectedText?: string;
  parentCommentId?: string;
}

// --- Documents ---

export async function createDocument(data: CreateDocumentRequest): Promise<DocumentDto> {
  const response = await api.post<{ data: DocumentDto }>("/document", data);
  return response.data.data;
}

export async function getDocument(id: string): Promise<DocumentDto> {
  const response = await api.get<{ data: DocumentDto }>(`/document/${id}`);
  return response.data.data;
}

export async function getWorkspaceDocuments(workspaceId: string): Promise<DocumentDto[]> {
  const response = await api.get<{ data: DocumentDto[] }>(`/document/workspace/${workspaceId}`);
  return response.data.data;
}

export async function updateDocument(id: string, data: UpdateDocumentRequest): Promise<DocumentDto> {
  const response = await api.put<{ data: DocumentDto }>(`/document/${id}`, data);
  return response.data.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/document/${id}`);
}

// --- Versions ---

export async function getDocumentVersions(documentId: string): Promise<DocumentVersionDto[]> {
  const response = await api.get<{ data: DocumentVersionDto[] }>(`/document/${documentId}/versions`);
  return response.data.data;
}

export async function restoreVersion(documentId: string, versionNumber: number): Promise<DocumentDto> {
  const response = await api.post<{ data: DocumentDto }>(
    `/document/${documentId}/versions/${versionNumber}/restore`
  );
  return response.data.data;
}

// --- Comments ---

export async function getDocumentComments(documentId: string): Promise<CommentDto[]> {
  const response = await api.get<{ data: CommentDto[] }>(`/document/${documentId}/comments`);
  return response.data.data;
}

export async function addComment(documentId: string, data: AddCommentRequest): Promise<CommentDto> {
  const response = await api.post<{ data: CommentDto }>(`/document/${documentId}/comments`, data);
  return response.data.data;
}

export async function resolveComment(commentId: string, isResolved: boolean): Promise<void> {
  await api.put(`/document/comments/${commentId}/resolve`, { commentId, isResolved });
}

export async function addReaction(commentId: string, emoji: string): Promise<ReactionDto> {
  const response = await api.post<{ data: ReactionDto }>(`/document/comments/${commentId}/reactions`, {
    commentId,
    emoji,
  });
  return response.data.data;
}

export async function removeReaction(commentId: string, emoji: string): Promise<void> {
  await api.delete(`/document/comments/${commentId}/reactions/${encodeURIComponent(emoji)}`);
}
