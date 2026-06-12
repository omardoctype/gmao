import { apiGetData, apiPatchData } from "@/services/api";
import type { NotificationItem } from "@/types/notification";

const NOTIFICATIONS_API_BASE = "/api/notifications";

export function getNotifications(): Promise<NotificationItem[]> {
  return apiGetData<NotificationItem[]>(NOTIFICATIONS_API_BASE);
}

export function getUnreadNotifications(): Promise<NotificationItem[]> {
  return apiGetData<NotificationItem[]>(`${NOTIFICATIONS_API_BASE}/unread`);
}

export function markNotificationAsRead(id: number): Promise<NotificationItem> {
  return apiPatchData<NotificationItem>(`${NOTIFICATIONS_API_BASE}/${id}/read`);
}
