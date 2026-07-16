"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Filter, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useNotificationStore } from "@/features/notifications/stores/notificationStore";
import { useAuthStore } from "@/store";
import NotificationItem from "@/features/notifications/components/NotificationItem";

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
    ? (notifications || []).filter((n) => !n.isRead)
    : notifications;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-sm text-muted-foreground">Stay updated with your team activity</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-0.5">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filter === "all"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  filter === "unread"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Unread
                {totalUnread > 0 && (
                  <span className="text-[10px] bg-primary/20 px-1.5 py-0.5 rounded-full font-bold">
                    {totalUnread}
                  </span>
                )}
              </button>
            </div>

            {totalUnread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-white/[0.06]">
                {filter === "unread" ? (
                  <Inbox className="h-8 w-8 text-primary/40" />
                ) : (
                  <Bell className="h-8 w-8 text-primary/40" />
                )}
              </div>
            </div>
            <h3 className="text-lg font-medium mb-1">
              {filter === "unread" ? "All caught up!" : "No notifications yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {filter === "unread"
                ? "You're all caught up. New notifications will appear here."
                : "When you receive notifications, they'll show up here."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2"
          >
            <AnimatePresence>
              {filtered.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
