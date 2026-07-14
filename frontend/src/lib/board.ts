import api from "./api";

export interface BoardDto {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  authorId: string;
  authorName: string;
  columnCount: number;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnDto {
  id: string;
  name: string;
  color?: string;
  order: number;
  cardCount: number;
}

export interface CardDto {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  order: number;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatarUrl?: string;
  dueDate?: string;
  priority: string;
  labels: LabelDto[];
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LabelDto {
  id: string;
  name: string;
  color: string;
}

export interface CardCommentDto {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  createdAt: string;
}

export interface CardAttachmentDto {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedByName: string;
  createdAt: string;
}

export interface ActivityDto {
  id: string;
  activityType: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  cardId?: string;
  cardTitle?: string;
  createdAt: string;
}

export interface BoardMemberDto {
  userId: string;
  name: string;
  avatarUrl?: string;
  email: string;
}

export interface BoardWithCardsDto {
  board: BoardDto;
  columns: {
    column: ColumnDto;
    cards: CardDto[];
  }[];
}

// --- Board CRUD ---

export async function createBoard(data: { workspaceId: string; name: string; description?: string }): Promise<BoardDto> {
  const response = await api.post<{ data: BoardDto }>("/board", data);
  return response.data.data;
}

export async function getBoard(id: string): Promise<BoardDto> {
  const response = await api.get<{ data: BoardDto }>(`/board/${id}`);
  return response.data.data;
}

export async function getWorkspaceBoards(workspaceId: string): Promise<BoardDto[]> {
  const response = await api.get<{ data: BoardDto[] }>(`/board/workspace/${workspaceId}`);
  return response.data.data;
}

export async function getBoardFull(id: string): Promise<BoardWithCardsDto> {
  const response = await api.get<{ data: BoardWithCardsDto }>(`/board/${id}/full`);
  return response.data.data;
}

export async function updateBoard(id: string, data: { name?: string; description?: string }): Promise<BoardDto> {
  const response = await api.put<{ data: BoardDto }>(`/board/${id}`, data);
  return response.data.data;
}

export async function deleteBoard(id: string): Promise<void> {
  await api.delete(`/board/${id}`);
}

// --- Columns ---

export async function createColumn(data: { boardId: string; name: string; color?: string }): Promise<ColumnDto> {
  const response = await api.post<{ data: ColumnDto }>("/board/columns", data);
  return response.data.data;
}

export async function updateColumn(id: string, data: { name?: string; color?: string }): Promise<ColumnDto> {
  const response = await api.put<{ data: ColumnDto }>(`/board/columns/${id}`, data);
  return response.data.data;
}

export async function deleteColumn(id: string): Promise<void> {
  await api.delete(`/board/columns/${id}`);
}

export async function reorderColumns(boardId: string, columnIds: string[]): Promise<void> {
  await api.put("/board/columns/reorder", { boardId, columnIds });
}

// --- Cards ---

export async function createCard(data: { columnId: string; title: string; description?: string }): Promise<CardDto> {
  const response = await api.post<{ data: CardDto }>("/board/cards", data);
  return response.data.data;
}

export async function updateCard(id: string, data: { title?: string; description?: string; priority?: string; dueDate?: string }): Promise<CardDto> {
  const response = await api.put<{ data: CardDto }>(`/board/cards/${id}`, data);
  return response.data.data;
}

export async function deleteCard(id: string): Promise<void> {
  await api.delete(`/board/cards/${id}`);
}

export async function moveCard(data: { cardId: string; targetColumnId: string; newOrder: number }): Promise<CardDto> {
  const response = await api.put<{ data: CardDto }>("/board/cards/move", data);
  return response.data.data;
}

export async function reorderCards(columnId: string, cardIds: string[]): Promise<void> {
  await api.put("/board/cards/reorder", { columnId, cardIds });
}

export async function assignCard(data: { cardId: string; userId?: string }): Promise<CardDto> {
  const response = await api.put<{ data: CardDto }>("/board/cards/assign", data);
  return response.data.data;
}

// --- Labels ---

export async function createLabel(data: { workspaceId: string; name: string; color: string }): Promise<LabelDto> {
  const response = await api.post<{ data: LabelDto }>("/board/labels", data);
  return response.data.data;
}

export async function addLabelToCard(data: { cardId: string; labelId: string }): Promise<void> {
  await api.post("/board/cards/labels", data);
}

export async function removeLabelFromCard(data: { cardId: string; labelId: string }): Promise<void> {
  await api.delete("/board/cards/labels", { data });
}

export async function deleteLabel(id: string): Promise<void> {
  await api.delete(`/board/labels/${id}`);
}

// --- Comments ---

export async function addCardComment(data: { cardId: string; content: string }): Promise<CardCommentDto> {
  const response = await api.post<{ data: CardCommentDto }>("/board/cards/comments", data);
  return response.data.data;
}

export async function deleteCardComment(commentId: string): Promise<void> {
  await api.delete(`/board/cards/comments/${commentId}`);
}

// --- Attachments ---

export async function addCardAttachment(data: { cardId: string; filename: string; url: string; size: number; mimeType: string }): Promise<CardAttachmentDto> {
  const response = await api.post<{ data: CardAttachmentDto }>("/board/cards/attachments", data);
  return response.data.data;
}

export async function deleteCardAttachment(attachmentId: string): Promise<void> {
  await api.delete(`/board/cards/attachments/${attachmentId}`);
}

// --- Activity ---

export async function getBoardActivity(boardId: string, limit = 50): Promise<ActivityDto[]> {
  const response = await api.get<{ data: ActivityDto[] }>(`/board/${boardId}/activity?limit=${limit}`);
  return response.data.data;
}

// --- Members ---

export async function getWorkspaceMembers(workspaceId: string): Promise<BoardMemberDto[]> {
  const response = await api.get<{ data: BoardMemberDto[] }>(`/board/workspace/${workspaceId}/members`);
  return response.data.data;
}
