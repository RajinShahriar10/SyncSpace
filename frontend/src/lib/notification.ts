import api from "./api";

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  userId: string;
  isRead: boolean;
  actionUrl?: string;
  actorName?: string;
  actorAvatarUrl?: string;
  createdAt: string;
}

export interface NotificationSummaryDto {
  totalUnread: number;
  totalToday: number;
  recentNotifications: NotificationDto[];
}

export async function getNotifications(
  userId: string,
  params?: { unreadOnly?: boolean; page?: number; pageSize?: number }
): Promise<NotificationDto[]> {
  const q = new URLSearchParams({ userId });
  if (params?.unreadOnly) q.set("unreadOnly", "true");
  if (params?.page) q.set("page", params.page.toString());
  if (params?.pageSize) q.set("pageSize", params.pageSize.toString());
  const res = await api.get<{ data: NotificationDto[] }>(`/notification?${q}`);
  return res.data.data;
}

export async function getNotificationSummary(userId: string): Promise<NotificationSummaryDto> {
  const res = await api.get<{ data: NotificationSummaryDto }>(`/notification/summary?userId=${userId}`);
  return res.data.data;
}

export async function markAsRead(id: string): Promise<void> {
  await api.put(`/notification/${id}/read`);
}

export async function markAllAsRead(userId: string): Promise<void> {
  await api.post(`/notification/read-all?userId=${userId}`);
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notification/${id}`);
}
