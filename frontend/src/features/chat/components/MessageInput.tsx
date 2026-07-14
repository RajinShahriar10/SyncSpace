"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Smile, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onSend: (content: string) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
}

export default function MessageInput({ onSend, onTyping, placeholder = "Type a message..." }: Props) {
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const emitTyping = useCallback((typing: boolean) => {
    if (onTyping && typing !== isTypingRef.current) {
      isTypingRef.current = typing;
      onTyping(typing);
    }
  }, [onTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleInput = (value: string) => {
    setContent(value);
    if (value.length > 0) {
      emitTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => emitTyping(false), 3000);
    } else {
      emitTyping(false);
    }
  };

  const handleSend = () => {
    if (!content.trim()) return;
    onSend(content.trim());
    setContent("");
    emitTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3 border-t border-white/5">
      <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#6366F1]/50 transition-colors">
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none max-h-32"
          style={{ minHeight: "24px" }}
        />
        <div className="flex items-center gap-1 shrink-0">
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
            <Smile className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!content.trim()}
            className="h-7 px-2.5 bg-[#6366F1] hover:bg-[#5558E6] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-zinc-600 mt-1 px-1">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
