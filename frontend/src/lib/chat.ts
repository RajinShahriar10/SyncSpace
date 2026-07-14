import api from "./api";

export interface ChannelDto {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  isPrivate: boolean;
  memberCount: number;
  unreadCount: number;
  lastMessage?: MessageDto;
  createdAt: string;
}

export interface MessageDto {
  id: string;
  content: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  threadId?: string;
  isEdited: boolean;
  isPinned: boolean;
  replyCount: number;
  reactions: ReactionDto[];
  attachments: AttachmentDto[];
  readBy: ReadReceiptDto[];
  createdAt: string;
  editedAt?: string;
}

export interface ReactionDto {
  emoji: string;
  count: number;
  me: boolean;
}

export interface AttachmentDto {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface ReadReceiptDto {
  userId: string;
  userName: string;
  avatarUrl?: string;
  readAt: string;
}

export interface ChatMemberDto {
  userId: string;
  name: string;
  avatarUrl?: string;
  email: string;
  role: string;
  isOnline: boolean;
}

export interface ConversationDto {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  otherUserOnline: boolean;
  unreadCount: number;
  lastMessage?: DirectMessageDto;
  lastMessageAt: string;
}

export interface DirectMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  isEdited: boolean;
  replyToId?: string;
  reactions: DmReactionDto[];
  attachments: AttachmentDto[];
  readBy: ReadReceiptDto[];
  createdAt: string;
}

export interface DmReactionDto {
  emoji: string;
  count: number;
  me: boolean;
}

// --- Channels ---

export async function getWorkspaceChannels(workspaceId: string): Promise<ChannelDto[]> {
  const res = await api.get<{ data: ChannelDto[] }>(`/chat/workspaces/${workspaceId}/channels`);
  return res.data.data;
}

export async function getChannel(id: string): Promise<ChannelDto> {
  const res = await api.get<{ data: ChannelDto }>(`/chat/channels/${id}`);
  return res.data.data;
}

export async function createChannel(data: { workspaceId: string; name: string; description?: string; isPrivate?: boolean }): Promise<ChannelDto> {
  const res = await api.post<{ data: ChannelDto }>("/chat/channels", data);
  return res.data.data;
}

export async function updateChannel(id: string, data: { name?: string; description?: string }): Promise<ChannelDto> {
  const res = await api.put<{ data: ChannelDto }>(`/chat/channels/${id}`, data);
  return res.data.data;
}

export async function deleteChannel(id: string): Promise<void> {
  await api.delete(`/chat/channels/${id}`);
}

export async function joinChannel(channelId: string): Promise<void> {
  await api.post(`/chat/channels/${channelId}/join`);
}

export async function leaveChannel(channelId: string): Promise<void> {
  await api.post(`/chat/channels/${channelId}/leave`);
}

// --- Messages ---

export async function getChannelMessages(channelId: string, limit = 50, before?: string): Promise<MessageDto[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (before) params.set("before", before);
  const res = await api.get<{ data: MessageDto[] }>(`/chat/channels/${channelId}/messages?${params}`);
  return res.data.data;
}

export async function sendMessage(channelId: string, content: string, threadId?: string): Promise<MessageDto> {
  const res = await api.post<{ data: MessageDto }>(`/chat/channels/${channelId}/messages`, { content, threadId });
  return res.data.data;
}

export async function editMessage(messageId: string, content: string): Promise<MessageDto> {
  const res = await api.put<{ data: MessageDto }>(`/chat/messages/${messageId}`, { content });
  return res.data.data;
}

export async function deleteMessage(messageId: string): Promise<void> {
  await api.delete(`/chat/messages/${messageId}`);
}

export async function pinMessage(messageId: string, pinned = true): Promise<void> {
  await api.post(`/chat/messages/${messageId}/pin?pinned=${pinned}`);
}

export async function getChannelPinnedMessages(channelId: string): Promise<MessageDto[]> {
  const res = await api.get<{ data: MessageDto[] }>(`/chat/channels/${channelId}/pinned`);
  return res.data.data;
}

export async function getChannelMembers(channelId: string): Promise<ChatMemberDto[]> {
  const res = await api.get<{ data: ChatMemberDto[] }>(`/chat/channels/${channelId}/members`);
  return res.data.data;
}

// --- Reactions ---

export async function addReaction(messageId: string, emoji: string): Promise<ReactionDto> {
  const res = await api.post<{ data: ReactionDto }>(`/chat/messages/${messageId}/reactions`, { emoji });
  return res.data.data;
}

export async function removeReaction(messageId: string, emoji: string): Promise<void> {
  await api.delete(`/chat/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`);
}

export async function markAsRead(channelId: string): Promise<void> {
  await api.post(`/chat/channels/${channelId}/read`);
}

// --- Direct Messages ---

export async function getConversations(workspaceId: string): Promise<ConversationDto[]> {
  const res = await api.get<{ data: ConversationDto[] }>(`/chat/workspaces/${workspaceId}/conversations`);
  return res.data.data;
}

export async function getOrCreateConversation(workspaceId: string, otherUserId: string): Promise<ConversationDto> {
  const res = await api.post<{ data: ConversationDto }>(`/chat/workspaces/${workspaceId}/conversations`, { otherUserId });
  return res.data.data;
}

export async function getDirectMessages(conversationId: string, limit = 50): Promise<DirectMessageDto[]> {
  const res = await api.get<{ data: DirectMessageDto[] }>(`/chat/conversations/${conversationId}/messages?limit=${limit}`);
  return res.data.data;
}

export async function sendDirectMessage(conversationId: string, content: string, replyToId?: string): Promise<DirectMessageDto> {
  const res = await api.post<{ data: DirectMessageDto }>(`/chat/conversations/${conversationId}/messages`, { content, replyToId });
  return res.data.data;
}

export async function editDirectMessage(messageId: string, content: string): Promise<DirectMessageDto> {
  const res = await api.put<{ data: DirectMessageDto }>(`/chat/dm/${messageId}`, { content });
  return res.data.data;
}

export async function deleteDirectMessage(messageId: string): Promise<void> {
  await api.delete(`/chat/dm/${messageId}`);
}

export async function addDmReaction(messageId: string, emoji: string): Promise<DmReactionDto> {
  const res = await api.post<{ data: DmReactionDto }>(`/chat/dm/${messageId}/reactions`, { emoji });
  return res.data.data;
}

export async function removeDmReaction(messageId: string, emoji: string): Promise<void> {
  await api.delete(`/chat/dm/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`);
}

export async function markDmRead(conversationId: string): Promise<void> {
  await api.post(`/chat/conversations/${conversationId}/read`);
}
