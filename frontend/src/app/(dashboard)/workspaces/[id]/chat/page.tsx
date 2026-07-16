"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { getAccessToken } from "@/lib/auth";
import { useChatStore } from "@/features/chat/stores/chatStore";
import { useAuthStore } from "@/store";
import ChannelSidebar from "@/features/chat/components/ChannelSidebar";
import ChatHeader from "@/features/chat/components/ChatHeader";
import MessageList from "@/features/chat/components/MessageList";
import DmMessageList from "@/features/chat/components/DmMessageList";
import MessageInput from "@/features/chat/components/MessageInput";
import * as chatApi from "@/lib/chat";
import { MessageSquare, Hash, ArrowLeft } from "lucide-react";

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || "http://localhost:5000/hubs/chat";

export default function ChatPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const user = useAuthStore((s) => s.user);
  const {
    currentChannel, currentConversation, view,
    addMessage, updateMessage, removeMessage, togglePin, toggleReaction, updateTyping,
    addDmMessage, updateDmMessage, removeDmMessage, toggleDmReaction,
  } = useChatStore();

  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true);
  const connectionRef = useRef<HubConnection | null>(null);

  // Establish SignalR connection
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const conn = new HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    conn.start().then(() => {
      connectionRef.current = conn;
      setConnection(conn);
    }).catch(() => {});

    return () => {
      conn.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, []);

  // Subscribe to channel events
  useEffect(() => {
    const conn = connectionRef.current;
    if (!conn || !currentChannel) return;

    conn.invoke("JoinChannel", currentChannel.id).catch(console.error);

    const onMessage = (msg: any) => {
      addMessage({
        id: msg.id,
        content: msg.content,
        channelId: msg.channelId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderAvatarUrl: msg.senderAvatarUrl,
        threadId: msg.threadId,
        isEdited: false,
        isPinned: false,
        replyCount: 0,
        reactions: [],
        attachments: [],
        readBy: [],
        createdAt: msg.timestamp,
      });
    };

    const onEdited = (data: any) => updateMessage(data.messageId, data.content);
    const onDeleted = (data: any) => removeMessage(data.messageId);
    const onPinned = (data: any) => togglePin(data.messageId, data.isPinned);
    const onReactionAdded = (data: any) => toggleReaction(data.messageId, data.emoji, true);
    const onReactionRemoved = (data: any) => toggleReaction(data.messageId, data.emoji, false);
    const onTyping = (data: any) => {
      if (data.userId !== user?.id) updateTyping(data.userId, data.userName, data.isTyping);
    };

    conn.on("ReceiveMessage", onMessage);
    conn.on("MessageEdited", onEdited);
    conn.on("MessageDeleted", onDeleted);
    conn.on("MessagePinned", onPinned);
    conn.on("ReactionAdded", onReactionAdded);
    conn.on("ReactionRemoved", onReactionRemoved);
    conn.on("TypingIndicator", onTyping);

    return () => {
      conn.off("ReceiveMessage", onMessage);
      conn.off("MessageEdited", onEdited);
      conn.off("MessageDeleted", onDeleted);
      conn.off("MessagePinned", onPinned);
      conn.off("ReactionAdded", onReactionAdded);
      conn.off("ReactionRemoved", onReactionRemoved);
      conn.off("TypingIndicator", onTyping);
      conn.invoke("LeaveChannel", currentChannel.id).catch(console.error);
    };
  }, [connection, currentChannel, user?.id, addMessage, updateMessage, removeMessage, togglePin, toggleReaction, updateTyping]);

  // Subscribe to DM events
  useEffect(() => {
    const conn = connectionRef.current;
    if (!conn || !currentConversation) return;

    conn.invoke("JoinDm", currentConversation.id).catch(console.error);

    const onDm = (msg: any) => {
      addDmMessage({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderAvatarUrl: msg.senderAvatarUrl,
        content: msg.content,
        isEdited: false,
        replyToId: msg.replyToId,
        reactions: [],
        attachments: [],
        readBy: [],
        createdAt: msg.timestamp,
      });
    };

    const onDmEdited = (data: any) => updateDmMessage(data.messageId, data.content);
    const onDmDeleted = (data: any) => removeDmMessage(data.messageId);
    const onDmReactionAdded = (data: any) => toggleDmReaction(data.messageId, data.emoji, true);
    const onDmReactionRemoved = (data: any) => toggleDmReaction(data.messageId, data.emoji, false);

    conn.on("ReceiveDm", onDm);
    conn.on("DmMessageEdited", onDmEdited);
    conn.on("DmMessageDeleted", onDmDeleted);
    conn.on("DmReactionAdded", onDmReactionAdded);
    conn.on("DmReactionRemoved", onDmReactionRemoved);

    return () => {
      conn.off("ReceiveDm", onDm);
      conn.off("DmMessageEdited", onDmEdited);
      conn.off("DmMessageDeleted", onDmDeleted);
      conn.off("DmReactionAdded", onDmReactionAdded);
      conn.off("DmReactionRemoved", onDmReactionRemoved);
      conn.invoke("LeaveDm", currentConversation.id).catch(console.error);
    };
  }, [connection, currentConversation, user?.id, addDmMessage, updateDmMessage, removeDmMessage, toggleDmReaction]);

  const handleSendChannel = useCallback(async (content: string) => {
    if (!currentChannel) return;
    // Optimistic local add (server broadcast will also arrive via SignalR)
    if (connectionRef.current) {
      await connectionRef.current.invoke("SendMessage", currentChannel.id, content, null);
    }
    // Also persist via REST for durability
    try { await chatApi.sendMessage(currentChannel.id, content); } catch {}
  }, [currentChannel]);

  const handleSendDm = useCallback(async (content: string) => {
    if (!currentConversation) return;
    if (connectionRef.current) {
      await connectionRef.current.invoke("SendDmMessage", currentConversation.id, content, null);
    }
    try { await chatApi.sendDirectMessage(currentConversation.id, content); } catch {}
  }, [currentConversation]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (connectionRef.current && currentChannel) {
      connectionRef.current.invoke("SendTyping", currentChannel.id, isTyping).catch(console.error);
    }
  }, [currentChannel]);

  const showEmpty = !currentChannel && !currentConversation;

  return (
    <div className="flex h-full bg-[#0D0D14]">
      {/* Mobile sidebar toggle */}
      {mobileShowSidebar && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <ChannelSidebar workspaceId={workspaceId} onSelect={() => setMobileShowSidebar(false)} />
          <button onClick={() => setMobileShowSidebar(false)} className="absolute top-3 right-3 p-2 bg-white/10 rounded-lg text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <ChannelSidebar workspaceId={workspaceId} onSelect={() => {}} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {showEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-2xl bg-[#6366F1]/10 flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-[#6366F1]" />
            </div>
            <h2 className="text-2xl font-semibold text-zinc-200 mb-2">Welcome to Chat</h2>
            <p className="text-sm text-zinc-500 max-w-sm mb-8">
              Select a channel or start a direct message conversation to begin chatting with your team.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <button
                onClick={() => setMobileShowSidebar(true)}
                className="md:hidden flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-white/10 transition-all"
              >
                <Hash className="w-4 h-4 text-[#6366F1]" /> Browse channels
              </button>
            </div>
          </div>
        ) : (
          <>
            <ChatHeader />
            {currentChannel ? <MessageList /> : <DmMessageList />}
            {currentChannel ? (
              <MessageInput onSend={handleSendChannel} onTyping={handleTyping} placeholder={`Message #${currentChannel.name}`} />
            ) : currentConversation ? (
              <MessageInput onSend={handleSendDm} placeholder={`Message ${currentConversation.otherUserName}`} />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
