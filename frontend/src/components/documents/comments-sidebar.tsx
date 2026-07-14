"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { useAuthStore } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  X,
  MessageSquare,
  Send,
  SmilePlus,
  CheckCircle2,
  Circle,
  Reply,
} from "lucide-react";

interface CommentsSidebarProps {
  documentId: string;
  onClose: () => void;
}

const EMOJI_LIST = ["👍", "❤️", "😂", "🎉", "🤔", "👀", "🔥", "✅"];

export function CommentsSidebar({ documentId, onClose }: CommentsSidebarProps) {
  const { comments, fetchComments, addComment, resolveComment, addReaction, removeReaction } =
    useDocumentStore();
  const user = useAuthStore((s) => s.user);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    fetchComments(documentId);
  }, [documentId, fetchComments]);

  const activeComments = comments.filter((c) => (showResolved ? true : !c.isResolved));

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    await addComment(documentId, { content: newComment.trim() });
    setNewComment("");
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    await addComment(documentId, { content: replyContent.trim(), parentCommentId: parentId });
    setReplyContent("");
    setReplyTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="flex h-full w-[360px] flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Comments</h3>
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {activeComments.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`rounded-lg px-2 py-1 text-xs transition-colors ${
              showResolved
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-white/[0.06]"
            }`}
          >
            {showResolved ? "Hide" : "Show"} resolved
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Comment input */}
      <div className="border-b border-white/[0.06] p-3">
        <div className="flex gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/20 text-[10px] font-medium text-primary">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="relative flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
              placeholder="Add a comment..."
              rows={2}
              className="w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/30"
            />
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="absolute bottom-2 right-2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-auto p-3">
        {activeComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="mb-3 h-8 w-8 opacity-50" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs text-muted-foreground/60">Start a conversation</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {activeComments.map((comment, i) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.03 }}
                  className={`group rounded-lg border border-white/[0.06] p-3 transition-colors ${
                    comment.isResolved ? "opacity-50" : ""
                  } hover:border-white/[0.1]`}
                >
                  {/* Comment header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.userAvatarUrl} />
                        <AvatarFallback className="bg-primary/20 text-[9px] font-medium text-primary">
                          {comment.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{comment.userName}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => resolveComment(comment.id, !comment.isResolved)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                        title={comment.isResolved ? "Reopen" : "Resolve"}
                      >
                        {comment.isResolved ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Selected text highlight */}
                  {comment.selectedText && (
                    <div className="mt-2 rounded border-l-2 border-primary/40 bg-primary/5 px-2 py-1 text-xs italic text-muted-foreground">
                      &ldquo;{comment.selectedText}&rdquo;
                    </div>
                  )}

                  {/* Comment content */}
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{comment.content}</p>

                  {/* Reactions */}
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {comment.reactions.map((reaction) => (
                      <button
                        key={reaction.emoji}
                        onClick={() => {
                          if (reaction.userId === user?.id) {
                            removeReaction(comment.id, reaction.emoji);
                          } else {
                            addReaction(comment.id, reaction.emoji);
                          }
                        }}
                        className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-xs transition-colors hover:bg-white/[0.06]"
                      >
                        <span>{reaction.emoji}</span>
                        <span className="text-muted-foreground">{reaction.count}</span>
                      </button>
                    ))}

                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id)
                        }
                        className="rounded-full p-1 text-muted-foreground/40 opacity-0 transition-all hover:bg-white/[0.06] hover:text-foreground group-hover:opacity-100"
                      >
                        <SmilePlus className="h-3.5 w-3.5" />
                      </button>

                      {showEmojiPicker === comment.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-lg border border-white/[0.06] bg-surface p-1.5 shadow-xl"
                        >
                          {EMOJI_LIST.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                addReaction(comment.id, emoji);
                                setShowEmojiPicker(null);
                              }}
                              className="rounded p-1 text-sm transition-colors hover:bg-white/[0.06]"
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-white/[0.04] pl-4 pt-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={reply.userAvatarUrl} />
                            <AvatarFallback className="bg-primary/20 text-[8px] font-medium text-primary">
                              {reply.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium">{reply.userName}</span>
                              <span className="text-[9px] text-muted-foreground/60">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  {replyTo === comment.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 flex gap-2"
                    >
                      <input
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, () => handleReply(comment.id))}
                        placeholder="Reply..."
                        className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-primary/30"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyContent.trim()}
                        className="h-7 px-2"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
