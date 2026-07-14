"use client";

import { create } from "zustand";
import type {
  ChannelDto, MessageDto, ConversationDto, DirectMessageDto, ChatMemberDto
} from "@/lib/chat";
import * as chatApi from "@/lib/chat";

interface ChatState {
  channels: ChannelDto[];
  currentChannel: ChannelDto | null;
  messages: MessageDto[];
  channelMembers: ChatMemberDto[];
  pinnedMessages: MessageDto[];
  conversations: ConversationDto[];
  currentConversation: ConversationDto | null;
  dmMessages: DirectMessageDto[];
  typingUsers: { userId: string; userName: string; isTyping: boolean }[];
  view: "channels" | "dms";
  isLoading: boolean;
  error: string | null;

  setView: (view: "channels" | "dms") => void;
  fetchChannels: (workspaceId: string) => Promise<void>;
  selectChannel: (channel: ChannelDto) => Promise<void>;
  createChannel: (data: { workspaceId: string; name: string; description?: string; isPrivate?: boolean }) => Promise<ChannelDto>;
  deleteChannel: (id: string) => Promise<void>;
  fetchMessages: (channelId: string) => Promise<void>;
  addMessage: (msg: MessageDto) => void;
  updateMessage: (msgId: string, content: string) => void;
  removeMessage: (msgId: string) => void;
  togglePin: (msgId: string, isPinned: boolean) => void;
  toggleReaction: (msgId: string, emoji: string, me: boolean) => void;
  updateTyping: (userId: string, userName: string, isTyping: boolean) => void;

  fetchConversations: (workspaceId: string) => Promise<void>;
  selectConversation: (conv: ConversationDto) => Promise<void>;
  fetchDmMessages: (conversationId: string) => Promise<void>;
  addDmMessage: (msg: DirectMessageDto) => void;
  updateDmMessage: (msgId: string, content: string) => void;
  removeDmMessage: (msgId: string) => void;
  toggleDmReaction: (msgId: string, emoji: string, me: boolean) => void;

  fetchChannelMembers: (channelId: string) => Promise<void>;
  fetchPinnedMessages: (channelId: string) => Promise<void>;
  clearChannel: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [],
  currentChannel: null,
  messages: [],
  channelMembers: [],
  pinnedMessages: [],
  conversations: [],
  currentConversation: null,
  dmMessages: [],
  typingUsers: [],
  view: "channels",
  isLoading: false,
  error: null,

  setView: (view) => set({ view }),

  fetchChannels: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const channels = await chatApi.getWorkspaceChannels(workspaceId);
      set({ channels, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  selectChannel: async (channel) => {
    set({ currentChannel: channel, messages: [], isLoading: true, typingUsers: [] });
    try {
      const messages = await chatApi.getChannelMessages(channel.id);
      set({ messages, isLoading: false });
      await chatApi.markAsRead(channel.id);
    } catch { set({ isLoading: false }); }
  },

  createChannel: async (data) => {
    const channel = await chatApi.createChannel(data);
    set((s) => ({ channels: [...s.channels, channel] }));
    return channel;
  },

  deleteChannel: async (id) => {
    await chatApi.deleteChannel(id);
    set((s) => ({
      channels: s.channels.filter((c) => c.id !== id),
      currentChannel: s.currentChannel?.id === id ? null : s.currentChannel,
    }));
  },

  fetchMessages: async (channelId) => {
    try {
      const messages = await chatApi.getChannelMessages(channelId);
      set({ messages });
    } catch {}
  },

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  updateMessage: (msgId, content) => set((s) => ({
    messages: s.messages.map((m) => m.id === msgId ? { ...m, content, isEdited: true } : m),
  })),

  removeMessage: (msgId) => set((s) => ({
    messages: s.messages.filter((m) => m.id !== msgId),
  })),

  togglePin: (msgId, isPinned) => set((s) => ({
    messages: s.messages.map((m) => m.id === msgId ? { ...m, isPinned } : m),
  })),

  toggleReaction: (msgId, emoji, me) => set((s) => ({
    messages: s.messages.map((m) => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find((r) => r.emoji === emoji);
      if (existing) {
        if (me) {
          const updated = { ...existing, count: existing.count - 1, me: false };
          return { ...m, reactions: updated.count <= 0 ? m.reactions.filter((r) => r.emoji !== emoji) : m.reactions.map((r) => r.emoji === emoji ? updated : r) };
        }
        return { ...m, reactions: m.reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, me: true } : r) };
      }
      return { ...m, reactions: [...m.reactions, { emoji, count: 1, me: true }] };
    }),
  })),

  updateTyping: (userId, userName, isTyping) => set((s) => {
    if (!isTyping) return { typingUsers: s.typingUsers.filter((t) => t.userId !== userId) };
    const exists = s.typingUsers.some((t) => t.userId === userId);
    if (exists) return s;
    return { typingUsers: [...s.typingUsers, { userId, userName, isTyping }] };
  }),

  fetchConversations: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const conversations = await chatApi.getConversations(workspaceId);
      set({ conversations, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  selectConversation: async (conv) => {
    set({ currentConversation: conv, dmMessages: [], isLoading: true });
    try {
      const msgs = await chatApi.getDirectMessages(conv.id);
      set({ dmMessages: msgs, isLoading: false });
      await chatApi.markDmRead(conv.id);
    } catch { set({ isLoading: false }); }
  },

  fetchDmMessages: async (conversationId) => {
    try {
      const msgs = await chatApi.getDirectMessages(conversationId);
      set({ dmMessages: msgs });
    } catch {}
  },

  addDmMessage: (msg) => set((s) => ({ dmMessages: [...s.dmMessages, msg] })),

  updateDmMessage: (msgId, content) => set((s) => ({
    dmMessages: s.dmMessages.map((m) => m.id === msgId ? { ...m, content, isEdited: true } : m),
  })),

  removeDmMessage: (msgId) => set((s) => ({
    dmMessages: s.dmMessages.filter((m) => m.id !== msgId),
  })),

  toggleDmReaction: (msgId, emoji, me) => set((s) => ({
    dmMessages: s.dmMessages.map((m) => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find((r) => r.emoji === emoji);
      if (existing) {
        if (me) {
          const updated = { ...existing, count: existing.count - 1, me: false };
          return { ...m, reactions: updated.count <= 0 ? m.reactions.filter((r) => r.emoji !== emoji) : m.reactions.map((r) => r.emoji === emoji ? updated : r) };
        }
        return { ...m, reactions: m.reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, me: true } : r) };
      }
      return { ...m, reactions: [...m.reactions, { emoji, count: 1, me: true }] };
    }),
  })),

  fetchChannelMembers: async (channelId) => {
    try {
      const members = await chatApi.getChannelMembers(channelId);
      set({ channelMembers: members });
    } catch {}
  },

  fetchPinnedMessages: async (channelId) => {
    try {
      const pinned = await chatApi.getChannelPinnedMessages(channelId);
      set({ pinnedMessages: pinned });
    } catch {}
  },

  clearChannel: () => set({ currentChannel: null, messages: [], typingUsers: [], pinnedMessages: [], channelMembers: [] }),
}));
