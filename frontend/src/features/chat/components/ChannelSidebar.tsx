"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/features/chat/stores/chatStore";
import { Plus, Hash, Lock, MessageCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  workspaceId: string;
  onSelect: () => void;
}

export default function ChannelSidebar({ workspaceId, onSelect }: Props) {
  const {
    channels, conversations, view, setView, currentChannel, currentConversation,
    fetchChannels, fetchConversations, selectChannel, selectConversation, createChannel
  } = useChatStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetchChannels(workspaceId);
    fetchConversations(workspaceId);
  }, [workspaceId, fetchChannels, fetchConversations]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const ch = await createChannel({ workspaceId, name: newName.trim() });
    setNewName("");
    setShowCreate(false);
    await selectChannel(ch);
    onSelect();
  };

  const handleSelectChannel = async (ch: typeof channels[0]) => {
    await selectChannel(ch);
    onSelect();
  };

  const handleSelectConv = async (conv: typeof conversations[0]) => {
    await selectConversation(conv);
    onSelect();
  };

  return (
    <div className="w-64 bg-[#0A0A0F] border-r border-white/5 flex flex-col h-full">
      <div className="p-3 border-b border-white/5">
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setView("channels")}
            className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
              view === "channels" ? "bg-[#6366F1] text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Hash className="w-3 h-3 inline mr-1" />Channels
          </button>
          <button
            onClick={() => setView("dms")}
            className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
              view === "dms" ? "bg-[#6366F1] text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <MessageCircle className="w-3 h-3 inline mr-1" />DMs
          </button>
        </div>
        {view === "channels" && (
          showCreate ? (
            <div className="flex gap-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Channel name"
                className="h-7 text-xs bg-white/5 border-white/10"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <Button size="sm" onClick={handleCreate} className="h-7 px-2 text-xs bg-[#6366F1] hover:bg-[#5558E6]">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)} className="h-7 px-2 text-xs text-zinc-400">X</Button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Plus className="w-3 h-3" /> Create channel
            </button>
          )
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {view === "channels" ? (
          channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => handleSelectChannel(ch)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-all",
                currentChannel?.id === ch.id ? "bg-[#6366F1]/20 text-[#A5B4FC] border-r-2 border-[#6366F1]" : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {ch.isPrivate ? <Lock className="w-3.5 h-3.5 shrink-0" /> : <Hash className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{ch.name}</span>
              {ch.unreadCount > 0 && (
                <span className="ml-auto bg-[#6366F1] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {ch.unreadCount > 99 ? "99+" : ch.unreadCount}
                </span>
              )}
            </button>
          ))
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConv(conv)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm transition-all",
                currentConversation?.id === conv.id ? "bg-[#6366F1]/20 text-[#A5B4FC]" : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-medium">
                  {conv.otherUserName.charAt(0)}
                </div>
                {conv.otherUserOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0A0A0F]" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="truncate text-xs font-medium">{conv.otherUserName}</div>
                {conv.lastMessage && (
                  <div className="truncate text-[10px] text-zinc-500">{conv.lastMessage.content}</div>
                )}
              </div>
              {conv.unreadCount > 0 && (
                <span className="bg-[#6366F1] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
