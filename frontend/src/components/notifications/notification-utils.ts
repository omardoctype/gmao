import { AlertTriangle, Boxes, CheckCircle2, ClockAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BadgeProps } from "@/components/ui/badge";
import type { NotificationItem } from "@/types/notification";
import type { NotificationStatus, NotificationType } from "@/types/notification";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

interface NotificationTypeConfig {
  label: string;
  variant: NonNullable<BadgeProps["variant"]>;
  icon: LucideIcon;
}

const NOTIFICATION_TYPE_CONFIG: Record<string, NotificationTypeConfig> = {
  CRITICAL_STOCK: {
    label: "Stock critique",
    variant: "warning",
    icon: Boxes,
  },
  CRITICAL_BREAKDOWN: {
    label: "Panne critique",
    variant: "destructive",
    icon: AlertTriangle,
  },
  OVERDUE_WORK_ORDER: {
    label: "OT en retard",
    variant: "secondary",
    icon: ClockAlert,
  },
  WORK_ORDER_INTERVENTION: {
    label: "Intervention OT",
    variant: "success",
    icon: CheckCircle2,
  },
};

const DEFAULT_NOTIFICATION_CONFIG: NotificationTypeConfig = {
  label: "Notification",
  variant: "outline",
  icon: AlertTriangle,
};

export function getNotificationTypeConfig(type: NotificationType): NotificationTypeConfig {
  return NOTIFICATION_TYPE_CONFIG[type] ?? DEFAULT_NOTIFICATION_CONFIG;
}

export function formatNotificationDate(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return DATE_TIME_FORMATTER.format(parsedDate);
}

export function isUnreadNotification(status: NotificationStatus): boolean {
  return status === "UNREAD";
}

export function filterNotificationsByType(
  notifications: NotificationItem[],
  type: NotificationType,
): NotificationItem[] {
  return notifications.filter((notification) => notification.type === type);
}
