"use client";

import { Check, Trash2, MessageSquare, UserPlus, FileText, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationDto } from "@/lib/notification";

const TYPE_ICONS: Record<string, typeof Bell> = {
  Mention: MessageSquare,
  Assignment: UserPlus,
  Comment: MessageSquare,
  Update: FileText,
  Invite: UserPlus,
  System: Settings,
};

const TYPE_COLORS: Record<string, string> = {
  Mention: "text-[#6366F1] bg-[#6366F1]/10",
  Assignment: "text-[#06B6D4] bg-[#06B6D4]/10",
  Comment: "text-[#8B5CF6] bg-[#8B5CF6]/10",
  Update: "text-[#F59E0B] bg-[#F59E0B]/10",
  Invite: "text-[#10B981] bg-[#10B981]/10",
  System: "text-zinc-400 bg-zinc-400/10",
};

interface NotificationItemProps {
  notification: NotificationDto;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  const Icon = TYPE_ICONS[notification.type] || Bell;
  const colorClass = TYPE_COLORS[notification.type] || "text-zinc-400 bg-zinc-400/10";

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
        notification.isRead ? "opacity-60 hover:opacity-100" : "bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
    >
      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${notification.isRead ? "text-zinc-400" : "text-zinc-200"}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#6366F1]" />
          )}
        </div>
        <p className="text-xs text-zinc-500 truncate mt-0.5">{notification.message}</p>
        <p className="text-[11px] text-zinc-600 mt-1">{formatRelativeTime(notification.createdAt)}</p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500 hover:text-[#6366F1]"
            onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-red-400"
          onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
