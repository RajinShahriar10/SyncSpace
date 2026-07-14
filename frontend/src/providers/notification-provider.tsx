"use client";

import { useNotificationHub } from "@/hooks/useNotificationHub";
import { useAuthStore } from "@/store";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  useNotificationHub(user?.id);
  return <>{children}</>;
}
