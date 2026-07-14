"use client";

import { useBoardStore } from "@/features/boards/stores/boardStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CardDto } from "@/lib/board";
import { Calendar, MessageSquare, Paperclip, AlertTriangle, ArrowUp, ArrowUpRight, Minus } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

const PRIORITY_CONFIG: Record<string, { icon: typeof ArrowUp; color: string; bg: string; label: string }> = {
  Urgent: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Urgent" },
  High: { icon: ArrowUp, color: "text-orange-400", bg: "bg-orange-500/10", label: "High" },
  Medium: { icon: ArrowUpRight, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Medium" },
  Low: { icon: Minus, color: "text-blue-400", bg: "bg-blue-500/10", label: "Low" },
};

export function KanbanCard({ card }: { card: CardDto }) {
  const setSelectedCard = useBoardStore((s) => s.setSelectedCard);
  const priority = PRIORITY_CONFIG[card.priority];
  const isOverdue = card.dueDate && isPast(new Date(card.dueDate)) && !isToday(new Date(card.dueDate));
  const isDueToday = card.dueDate && isToday(new Date(card.dueDate));

  return (
    <div
      onClick={() => setSelectedCard(card)}
      className="group cursor-pointer rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-all hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-lg hover:shadow-black/20"
    >
      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className="h-1.5 w-8 rounded-full"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium leading-snug text-foreground">{card.title}</p>

      {/* Description preview */}
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/60">
          {card.description.slice(0, 100)}
        </p>
      )}

      {/* Footer */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority */}
          {priority && (
            <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium ${priority.color} ${priority.bg}`}>
              <priority.icon className="h-2.5 w-2.5" />
              {priority.label}
            </span>
          )}

          {/* Due date */}
          {card.dueDate && (
            <span className={`flex items-center gap-0.5 text-[10px] ${
              isOverdue ? "text-red-400" : isDueToday ? "text-yellow-400" : "text-muted-foreground/60"
            }`}>
              <Calendar className="h-2.5 w-2.5" />
              {format(new Date(card.dueDate), "MMM d")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {card.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
              <MessageSquare className="h-2.5 w-2.5" />
              {card.commentCount}
            </span>
          )}
          {card.attachmentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
              <Paperclip className="h-2.5 w-2.5" />
              {card.attachmentCount}
            </span>
          )}
          {card.assigneeName && (
            <Avatar className="h-5 w-5">
              <AvatarImage src={card.assigneeAvatarUrl} />
              <AvatarFallback className="bg-primary/20 text-[8px] font-medium text-primary">
                {card.assigneeName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
