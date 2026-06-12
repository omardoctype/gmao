import { Badge } from "@/components/ui/badge";
import { getNotificationTypeConfig } from "@/components/notifications/notification-utils";
import type { NotificationType } from "@/types/notification";

interface NotificationTypeBadgeProps {
  type: NotificationType;
}

export function NotificationTypeBadge({ type }: NotificationTypeBadgeProps) {
  const config = getNotificationTypeConfig(type);

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <config.icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
