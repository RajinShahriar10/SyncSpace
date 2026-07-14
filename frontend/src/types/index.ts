export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  icon?: string;
  plan: "free" | "pro" | "enterprise";
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: "owner" | "admin" | "member" | "viewer";
  user: User;
  joinedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  workspaceId: string;
  createdBy: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  author: User;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  columns: BoardColumn[];
}

export interface BoardColumn {
  id: string;
  name: string;
  boardId: string;
  order: number;
  color?: string;
  cards: BoardCard[];
}

export interface BoardCard {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  order: number;
  assigneeId?: string;
  assignee?: User;
  dueDate?: string;
  labels: Label[];
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  isPrivate: boolean;
  createdAt: string;
  memberCount: number;
}

export interface Message {
  id: string;
  content: string;
  channelId: string;
  senderId: string;
  sender: User;
  createdAt: string;
  updatedAt: string;
  reactions: Reaction[];
  threadId?: string;
  attachments: Attachment[];
}

export interface Reaction {
  id: string;
  emoji: string;
  messageId: string;
  userId: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  messageId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "mention" | "assignment" | "comment" | "update" | "invite";
  title: string;
  message: string;
  userId: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export type Theme = "dark" | "light" | "system";
