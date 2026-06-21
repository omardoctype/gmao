export type NotificationType =
  | "CRITICAL_STOCK"
  | "CRITICAL_BREAKDOWN"
  | "OVERDUE_WORK_ORDER"
  | "WORK_ORDER_INTERVENTION"
  | string;

export type NotificationStatus = "UNREAD" | "READ" | string;

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
}
