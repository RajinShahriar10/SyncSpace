"use client";

import { useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/features/notifications/stores/notificationStore";
import { useAuthStore } from "@/store";
import NotificationItem from "./NotificationItem";
import { cn } from "@/lib/utils";

export default function NotificationDropdown() {
  const { user } = useAuthStore();
  const {
    notifications, totalUnread, isOpen,
    fetchNotifications, fetchSummary, markAsRead, markAllAsRead, deleteNotification,
    setOpen, toggleOpen,
  } = useNotificationStore();

  const dropdownRef = useRef<HTMLDivElement>(null);

  const userId = user?.id ?? "";

  useEffect(() => {
    if (!userId) return;
    fetchSummary(userId);
  }, [userId, fetchSummary]);

  useEffect(() => {
    if (!userId || !isOpen) return;
    fetchNotifications(userId);
  }, [userId, isOpen, fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setOpen]);

  const handleMarkRead = useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);

  const handleMarkAllRead = useCallback(() => {
    if (userId) markAllAsRead(userId);
  }, [userId, markAllAsRead]);

  const handleDelete = useCallback((id: string) => {
    deleteNotification(id);
  }, [deleteNotification]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 text-zinc-400 hover:text-zinc-200"
        onClick={toggleOpen}
      >
        <Bell className="h-[18px] w-[18px]" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6366F1] px-1 text-[10px] font-bold text-white animate-in fade-in zoom-in duration-200">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-[420px] max-h-[520px] rounded-2xl border border-white/10 bg-[#0E0E18] shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-200">Notifications</h3>
              {totalUnread > 0 && (
                <span className="text-[10px] font-bold text-[#6366F1] bg-[#6366F1]/10 px-1.5 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </div>
            {totalUnread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-zinc-500 hover:text-[#6366F1]"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[420px] p-2 space-y-0.5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">No notifications yet</p>
                <p className="text-xs text-zinc-600 mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

          <div className="border-t border-white/10 px-4 py-2.5">
            <a
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors font-medium"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
