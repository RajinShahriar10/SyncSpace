"use client";

import { create } from "zustand";
import type { NotificationDto } from "@/lib/notification";
import * as notificationApi from "@/lib/notification";

interface NotificationState {
  notifications: NotificationDto[];
  totalUnread: number;
  totalToday: number;
  isLoading: boolean;
  isOpen: boolean;

  fetchNotifications: (userId: string) => Promise<void>;
  fetchSummary: (userId: string) => Promise<void>;
  addNotification: (notification: NotificationDto) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  totalUnread: 0,
  totalToday: 0,
  isLoading: false,
  isOpen: false,

  fetchNotifications: async (userId) => {
    set({ isLoading: true });
    try {
      const notifications = await notificationApi.getNotifications(userId, { pageSize: 20 });
      set({ notifications, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchSummary: async (userId) => {
    try {
      const summary = await notificationApi.getNotificationSummary(userId);
      set({ totalUnread: summary.totalUnread, totalToday: summary.totalToday });
    } catch {}
  },

  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
      totalUnread: s.totalUnread + (notification.isRead ? 0 : 1),
    })),

  markAsRead: async (id) => {
    try {
      await notificationApi.markAsRead(id);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        totalUnread: Math.max(0, s.totalUnread - 1),
      }));
    } catch {}
  },

  markAllAsRead: async (userId) => {
    try {
      await notificationApi.markAllAsRead(userId);
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        totalUnread: 0,
      }));
    } catch {}
  },

  deleteNotification: async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      set((s) => {
        const target = s.notifications.find((n) => n.id === id);
        return {
          notifications: s.notifications.filter((n) => n.id !== id),
          totalUnread: target && !target.isRead ? Math.max(0, s.totalUnread - 1) : s.totalUnread,
        };
      });
    } catch {}
  },

  setOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
}));
