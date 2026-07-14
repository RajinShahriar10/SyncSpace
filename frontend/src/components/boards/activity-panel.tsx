"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useBoardStore } from "@/features/boards/stores/boardStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import {
  Plus, Minus, ArrowRight, MessageSquare, Tag, Paperclip,
  AlertTriangle, Calendar, User, X, History,
} from "lucide-react";
import type { ActivityDto } from "@/lib/board";

const ACTIVITY_ICONS: Record<string, { icon: typeof Plus; color: string }> = {
  Created: { icon: Plus, color: "text-green-400" },
  Moved: { icon: ArrowRight, color: "text-blue-400" },
  Assigned: { icon: User, color: "text-purple-400" },
  Unassigned: { icon: User, color: "text-muted-foreground" },
  CommentAdded: { icon: MessageSquare, color: "text-cyan-400" },
  PriorityChanged: { icon: AlertTriangle, color: "text-orange-400" },
  DueDateChanged: { icon: Calendar, color: "text-yellow-400" },
  AttachmentAdded: { icon: Paperclip, color: "text-pink-400" },
  LabelAdded: { icon: Tag, color: "text-green-400" },
  LabelRemoved: { icon: Tag, color: "text-red-400" },
  Updated: { icon: Plus, color: "text-foreground" },
  Deleted: { icon: Minus, color: "text-red-400" },
};

interface ActivityPanelProps {
  boardId: string;
  onClose: () => void;
}

export function ActivityPanel({ boardId, onClose }: ActivityPanelProps) {
  const { activity, fetchActivity } = useBoardStore();

  useEffect(() => {
    fetchActivity(boardId);
  }, [boardId, fetchActivity]);

  return (
    <div className="flex h-full w-80 flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Activity</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="mb-3 h-8 w-8 opacity-50" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activity.map((a, i) => {
              const config = ACTIVITY_ICONS[a.activityType] || ACTIVITY_ICONS.Updated;
              const Icon = config.icon;

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.03]"
                >
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={a.userAvatarUrl} />
                    <AvatarFallback className="bg-primary/20 text-[8px] font-medium text-primary">
                      {a.userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed">
                      <span className="font-medium">{a.userName.split(" ")[0]}</span>{" "}
                      <span className="text-muted-foreground">{a.description}</span>
                    </p>
                    {a.cardTitle && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                        on <span className="font-medium text-foreground/60">{a.cardTitle}</span>
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-muted-foreground/40">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  <Icon className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${config.color}`} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
