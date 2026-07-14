"use client";

import { Hash, Lock, Users, Pin, X } from "lucide-react";
import { useChatStore } from "@/features/chat/stores/chatStore";
import { useState } from "react";

export default function ChatHeader() {
  const { currentChannel, currentConversation, pinnedMessages, fetchPinnedMessages, fetchChannelMembers } = useChatStore();
  const [showPinned, setShowPinned] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  if (currentConversation) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0D0D14]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-sm font-medium">
              {currentConversation.otherUserName.charAt(0)}
            </div>
            {currentConversation.otherUserOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0D0D14]" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200">{currentConversation.otherUserName}</h3>
            <p className="text-[10px] text-zinc-500">{currentConversation.otherUserOnline ? "Online" : "Offline"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentChannel) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0D0D14]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 flex items-center justify-center">
            {currentChannel.isPrivate ? (
              <Lock className="w-4 h-4 text-[#6366F1]" />
            ) : (
              <Hash className="w-4 h-4 text-[#6366F1]" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200">{currentChannel.name}</h3>
            {currentChannel.description && (
              <p className="text-[10px] text-zinc-500 truncate max-w-[300px]">{currentChannel.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowPinned(!showPinned); if (!showPinned && currentChannel) fetchPinnedMessages(currentChannel.id); }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-[#F59E0B] transition-colors relative"
            title="Pinned messages"
          >
            <Pin className="w-4 h-4" />
            {pinnedMessages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#F59E0B] text-[8px] text-black font-bold rounded-full flex items-center justify-center">
                {pinnedMessages.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setShowMembers(!showMembers); if (!showMembers && currentChannel) fetchChannelMembers(currentChannel.id); }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
            title="Members"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
