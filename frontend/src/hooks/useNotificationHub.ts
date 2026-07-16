"use client";

import { useEffect, useRef } from "react";
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { getAccessToken } from "@/lib/auth";
import { useNotificationStore } from "@/features/notifications/stores/notificationStore";
import type { NotificationDto } from "@/lib/notification";

const HUB_URL = process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL || "http://localhost:5000/hubs/notifications";

export function useNotificationHub(userId: string | undefined) {
  const connectionRef = useRef<HubConnection | null>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const fetchSummary = useNotificationStore((s) => s.fetchSummary);

  useEffect(() => {
    if (!userId) return;
    const token = getAccessToken();
    if (!token) return;

    const conn = new HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging({ logLevel: "none" } as any)
      .build();

    conn.on("NewNotification", (notification: NotificationDto) => {
      addNotification(notification);
      fetchSummary(userId);
    });

    conn.start()
      .then(() => { connectionRef.current = conn; })
      .catch(() => {
        // Backend not available — will retry on reconnect
      });

    return () => {
      conn.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [userId, addNotification, fetchSummary]);
}
