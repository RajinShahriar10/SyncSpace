"use client";

import { memo, useEffect, useRef } from "react";
import Image from "next/image";
import { useChatStore } from "@/features/chat/stores/chatStore";
import { useAuthStore } from "@/store";
import { format } from "date-fns";
import { SmilePlus, Pin, Pencil, Trash2, MessageSquare } from "lucide-react";
import * as chatApi from "@/lib/chat";

const EMOJI_QUICK = ["👍", "❤️", "😂", "🎉", "🚀", "👀"];

export default memo(function MessageList() {
  const { messages, typingUsers, toggleReaction, togglePin } = useChatStore();
  const user = useAuthStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleReaction = async (msgId: string, emoji: string) => {
    try {
      const existing = messages.find((m) => m.id === msgId)?.reactions.find((r) => r.emoji === emoji && r.me);
      if (existing) await chatApi.removeReaction(msgId, emoji);
      else await chatApi.addReaction(msgId, emoji);
      toggleReaction(msgId, emoji, !existing);
    } catch {}
  };

  const handlePin = async (msgId: string, isPinned: boolean) => {
    try {
      await chatApi.pinMessage(msgId, !isPinned);
      togglePin(msgId, !isPinned);
    } catch {}
  };

  const handleDelete = async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    try { await chatApi.deleteMessage(msgId); useChatStore.getState().removeMessage(msgId); } catch {}
  };

  const handleEdit = async (msgId: string, current: string) => {
    const newContent = prompt("Edit message:", current);
    if (newContent && newContent !== current) {
      try {
        await chatApi.editMessage(msgId, newContent);
        useChatStore.getState().updateMessage(msgId, newContent);
      } catch {}
    }
  };

  let lastDate = "";

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
      {messages.map((msg) => {
        const isMe = msg.senderId === user?.id;
        const msgDate = format(new Date(msg.createdAt), "MMM d, yyyy");
        const showDate = msgDate !== lastDate;
        lastDate = msgDate;

        return (
          <div key={msg.id}>
            {showDate && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-zinc-500 font-medium">{msgDate}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            )}
            <div className="group relative flex gap-3 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-medium shrink-0">
                {msg.senderAvatarUrl ? (
                  <Image src={msg.senderAvatarUrl} alt="" width={32} height={32} unoptimized className="w-full h-full rounded-full object-cover" />
                ) : msg.senderName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-zinc-200">{msg.senderName}</span>
                  <span className="text-[10px] text-zinc-600">{format(new Date(msg.createdAt), "h:mm a")}</span>
                  {msg.isEdited && <span className="text-[10px] text-zinc-600 italic">(edited)</span>}
                  {msg.isPinned && <Pin className="w-3 h-3 text-[#F59E0B] inline" />}
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words mt-0.5">{msg.content}</p>
                {msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.reactions.map((r) => (
                      <button
                        key={r.emoji}
                        onClick={() => handleReaction(msg.id, r.emoji)}
                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border transition-all ${
                          r.me ? "bg-[#6366F1]/20 border-[#6366F1]/40 text-[#A5B4FC]" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                        }`}
                      >
                        <span>{r.emoji}</span>
                        <span className="font-medium">{r.count}</span>
                      </button>
                    ))}
                  </div>
                )}
                {msg.replyCount > 0 && (
                  <button className="flex items-center gap-1 mt-1 text-[11px] text-[#6366F1] hover:text-[#818CF8]">
                    <MessageSquare className="w-3 h-3" /> {msg.replyCount} {msg.replyCount === 1 ? "reply" : "replies"}
                  </button>
                )}
              </div>
              <div className="absolute right-2 -top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-[#12121A] border border-white/10 rounded-lg px-1 py-0.5 shadow-xl">
                <div className="relative group/emoji">
                  <button className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white">
                    <SmilePlus className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute right-0 top-8 z-50 hidden group-hover/emoji:flex gap-0.5 bg-[#1A1A24] border border-white/10 rounded-lg p-1 shadow-2xl">
                    {EMOJI_QUICK.map((e) => (
                      <button key={e} onClick={() => handleReaction(msg.id, e)} className="p-1 rounded hover:bg-white/10 text-sm">{e}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => handlePin(msg.id, msg.isPinned)} className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-[#F59E0B]">
                  <Pin className="w-3.5 h-3.5" />
                </button>
                {isMe && (
                  <>
                    <button onClick={() => handleEdit(msg.id, msg.content)} className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(msg.id)} className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-zinc-500">
          <div className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
          </div>
          {typingUsers.map((t) => t.userName).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
})
