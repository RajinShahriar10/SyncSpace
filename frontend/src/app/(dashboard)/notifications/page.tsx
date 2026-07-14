"use client";

import { useEffect, useCallback } from "react";
import { Bell, CheckCheck, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useNotificationStore } from "@/features/notifications/stores/notificationStore";
import { useAuthStore } from "@/store";
import NotificationItem from "@/features/notifications/components/NotificationItem";
import { useState } from "react";

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const {
    notifications, totalUnread, isLoading,
    fetchNotifications, fetchSummary, markAsRead, markAllAsRead, deleteNotification,
  } = useNotificationStore();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const userId = user?.id ?? "";

  useEffect(() => {
    if (!userId) return;
    fetchNotifications(userId);
    fetchSummary(userId);
  }, [userId, fetchNotifications, fetchSummary]);

  const handleMarkRead = useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);

  const handleMarkAllRead = useCallback(() => {
    if (userId) markAllAsRead(userId);
  }, [userId, markAllAsRead]);

  const handleDelete = useCallback((id: string) => {
    deleteNotification(id);
  }, [deleteNotification]);

  const filtered = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-200">Notifications</h1>
              <p className="text-sm text-zinc-500">Stay updated with your team activity</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filter === "all"
                    ? "bg-[#6366F1]/20 text-[#6366F1]"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  filter === "unread"
                    ? "bg-[#6366F1]/20 text-[#6366F1]"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Unread
                {totalUnread > 0 && (
                  <span className="text-[10px] bg-[#6366F1]/30 px-1 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </button>
            </div>

            {totalUnread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-zinc-500 hover:text-[#6366F1]"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-zinc-700" />
            </div>
            <h3 className="text-lg font-medium text-zinc-400 mb-1">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-sm text-zinc-600 max-w-sm">
              {filter === "unread"
                ? "You're all caught up! New notifications will appear here."
                : "When you receive notifications, they'll show up here."}
            </p>
          </div>
        ) : (
          <div className="space-y-1 bg-white/[0.02] rounded-2xl border border-white/10 p-2">
            {filtered.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
