"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore } from "@/features/boards/stores/boardStore";
import { useAuthStore } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  X, Calendar, Tag, User, MessageSquare, Paperclip, AlertTriangle,
  ArrowUp, ArrowUpRight, Minus, Send, Trash2, CheckCircle2, Clock,
} from "lucide-react";

const PRIORITY_OPTIONS = [
  { value: "None", label: "No priority", icon: null, color: "" },
  { value: "Low", label: "Low", icon: Minus, color: "text-blue-400" },
  { value: "Medium", label: "Medium", icon: ArrowUpRight, color: "text-yellow-400" },
  { value: "High", label: "High", icon: ArrowUp, color: "text-orange-400" },
  { value: "Urgent", label: "Urgent", icon: AlertTriangle, color: "text-red-400" },
];

export function CardDetailModal() {
  const { selectedCard, setSelectedCard, updateCard, assignCard, members, addLabelToCard, removeLabelFromCard, addCardComment } = useBoardStore();
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");
  const [showPriority, setShowPriority] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  useEffect(() => {
    if (selectedCard) {
      setTitle(selectedCard.title);
      setDescription(selectedCard.description || "");
    }
  }, [selectedCard?.id]);

  if (!selectedCard) return null;

  const handleSaveTitle = () => {
    if (title.trim() && title !== selectedCard.title) {
      updateCard(selectedCard.id, { title: title.trim() });
    }
  };

  const handleSaveDescription = () => {
    if (description !== (selectedCard.description || "")) {
      updateCard(selectedCard.id, { description });
    }
  };

  const handlePriority = async (priority: string) => {
    await updateCard(selectedCard.id, { priority });
    setShowPriority(false);
  };

  const handleAssign = async (userId?: string) => {
    await assignCard(selectedCard.id, userId);
    setShowAssign(false);
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    await addCardComment(selectedCard.id, comment.trim());
    setComment("");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={() => setSelectedCard(null)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl border border-white/[0.06] bg-surface shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex-1">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="w-full bg-transparent text-lg font-semibold text-foreground outline-none"
              />
              {selectedCard.dueDate && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Due {format(new Date(selectedCard.dueDate), "MMM d, yyyy")}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedCard(null)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-6 p-6">
            {/* Main content */}
            <div className="flex-1 space-y-6">
              {/* Description */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h4>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  placeholder="Add a description..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/30"
                />
              </div>

              {/* Comments */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <MessageSquare className="mr-1 inline h-3 w-3" />
                  Comments
                </h4>
                <div className="flex gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/20 text-[10px] font-medium text-primary">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="relative flex-1">
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                      placeholder="Write a comment..."
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-primary/30"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!comment.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar actions */}
            <div className="w-48 space-y-3">
              {/* Priority */}
              <div className="relative">
                <button
                  onClick={() => { setShowPriority(!showPriority); setShowAssign(false); setShowLabels(false); }}
                  className="flex w-full items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-foreground transition-colors hover:bg-white/[0.06]"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                  {selectedCard.priority === "None" ? "Priority" : selectedCard.priority}
                </button>
                {showPriority && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-white/[0.06] bg-surface py-1 shadow-xl"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handlePriority(opt.value)}
                        className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-white/[0.06] ${
                          selectedCard.priority === opt.value ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {opt.icon && <opt.icon className={`h-3 w-3 ${opt.color}`} />}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Assignee */}
              <div className="relative">
                <button
                  onClick={() => { setShowAssign(!showAssign); setShowPriority(false); setShowLabels(false); }}
                  className="flex w-full items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-foreground transition-colors hover:bg-white/[0.06]"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {selectedCard.assigneeName || "Assignee"}
                </button>
                {showAssign && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-white/[0.06] bg-surface py-1 shadow-xl"
                  >
                    <button
                      onClick={() => handleAssign(undefined)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.06]"
                    >
                      Unassigned
                    </button>
                    {members.map((m) => (
                      <button
                        key={m.userId}
                        onClick={() => handleAssign(m.userId)}
                        className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-white/[0.06] ${
                          selectedCard.assigneeId === m.userId ? "text-primary" : "text-foreground"
                        }`}
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={m.avatarUrl} />
                          <AvatarFallback className="text-[8px]">{m.name[0]}</AvatarFallback>
                        </Avatar>
                        {m.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Due date */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Due Date</label>
                <input
                  type="date"
                  value={selectedCard.dueDate ? format(new Date(selectedCard.dueDate), "yyyy-MM-dd") : ""}
                  onChange={(e) => updateCard(selectedCard.id, { dueDate: e.target.value || undefined })}
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-foreground outline-none focus:border-primary/30"
                />
              </div>

              {/* Stats */}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Comments</span>
                  <span>{selectedCard.commentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> Attachments</span>
                  <span>{selectedCard.attachmentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Created</span>
                  <span>{format(new Date(selectedCard.createdAt), "MMM d")}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
