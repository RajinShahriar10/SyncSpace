"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Send, FileText, ClipboardList, PenTool, ListChecks,
  Zap, Loader2, Bot, User, Trash2, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIStore, type AIMessage } from "@/features/ai/stores/aiStore";

const QUICK_ACTIONS = [
  { id: "summarize", label: "Summarize", icon: FileText, color: "text-[#6366F1]", description: "Summarize the document content" },
  { id: "meeting-notes", label: "Meeting Notes", icon: ClipboardList, color: "text-[#10B981]", description: "Generate structured meeting notes" },
  { id: "rewrite", label: "Rewrite", icon: PenTool, color: "text-[#F59E0B]", description: "Rewrite content professionally" },
  { id: "tasks", label: "Task List", icon: ListChecks, color: "text-[#8B5CF6]", description: "Extract or create a task list" },
  { id: "actions", label: "Action Items", icon: Zap, color: "text-[#06B6D4]", description: "Extract actionable items" },
] as const;

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function MessageBubble({ msg }: { msg: AIMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#6366F1]/10 flex items-center justify-center mt-0.5">
          <Bot className="w-3.5 h-3.5 text-[#6366F1]" />
        </div>
      )}

      <div className={`max-w-[85%] group ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-[#6366F1]/20 text-zinc-100 rounded-br-md"
              : "bg-white/5 text-zinc-200 rounded-bl-md"
          }`}
        >
          {msg.content.split("\n").map((line, i) => (
            <span key={i}>
              {line.startsWith("# ") ? <span className="font-semibold text-zinc-100">{line.slice(2)}</span> :
               line.startsWith("## ") ? <span className="font-medium text-zinc-200">{line.slice(3)}</span> :
               line.startsWith("- [ ] ") ? <span className="text-zinc-300">{"\u2610 "}{line.slice(6)}</span> :
               line.startsWith("- ") ? <span className="text-zinc-300">{"\u2022 "}{line.slice(2)}</span> :
               line.startsWith("**") && line.endsWith("**") ? <span className="font-semibold text-zinc-100">{line.slice(2, -2)}</span> :
               line}
              {i < msg.content.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>

        <div className={`flex items-center gap-2 mt-1 ${isUser ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-zinc-600">{formatTime(msg.timestamp)}</span>
          {msg.tokensUsed && <span className="text-[10px] text-zinc-700">{msg.tokensUsed} tokens</span>}
          {!isUser && (
            <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity">
              {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3 text-zinc-600 hover:text-zinc-400" />}
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center mt-0.5">
          <User className="w-3.5 h-3.5 text-zinc-400" />
        </div>
      )}
    </motion.div>
  );
}

interface AIAssistantSidebarProps {
  documentContent?: string;
}

export default function AIAssistantSidebar({ documentContent = "" }: AIAssistantSidebarProps) {
  const { messages, isLoading, isOpen, error, toggleSidebar, closeSidebar, clearMessages, clearError, sendMessage, summarize, generateMeetingNotes, rewrite, createTaskList, extractActionItems } = useAIStore();
  const [input, setInput] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), documentContent);
    setInput("");
  };

  const handleQuickAction = (actionId: string) => {
    if (!documentContent.trim()) return;
    switch (actionId) {
      case "summarize": summarize(documentContent); break;
      case "meeting-notes": generateMeetingNotes(documentContent); break;
      case "rewrite": rewrite(documentContent, selectedTone); break;
      case "tasks": createTaskList(documentContent); break;
      case "actions": extractActionItems(documentContent); break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeSidebar}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] max-w-[100vw] sm:max-w-[calc(100vw-40px)] z-50 glass border-l border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">AI Assistant</h2>
                  <p className="text-[11px] text-zinc-500">Powered by OpenAI</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearMessages}>
                    <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeSidebar}>
                  <X className="w-4 h-4 text-zinc-500" />
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            {messages.length === 0 && (
              <div className="px-5 py-4 border-b border-white/5">
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action.id)}
                        disabled={!documentContent.trim() || isLoading}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed group"
                      >
                        <div className={`flex-shrink-0 mt-0.5 ${action.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-200 group-hover:text-zinc-100">{action.label}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{action.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Tone selector for Rewrite */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600">Rewrite tone:</span>
                  {["professional", "casual", "formal", "simple", "technical"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTone(t)}
                      className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${
                        selectedTone === t ? "bg-[#6366F1]/20 text-[#6366F1]" : "text-zinc-600 hover:text-zinc-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {!documentContent.trim() && (
                  <p className="text-[10px] text-zinc-600 mt-2 italic">Open a document to use quick actions</p>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {error}
                  <button onClick={clearError} className="ml-2 underline hover:text-red-300">Dismiss</button>
                </div>
              )}

              {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-[#6366F1]" />
                  </div>
                  <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-white/5">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Ask AI anything..."
                    rows={1}
                    className="w-full resize-none rounded-xl bg-white/5 border border-white/5 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#6366F1]/30 focus:ring-1 focus:ring-[#6366F1]/20 transition-all"
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-[#6366F1] hover:bg-[#6366F1]/80 text-white shrink-0 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
