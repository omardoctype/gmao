import { Check } from "lucide-react";
import { NotificationTypeBadge } from "@/components/notifications/NotificationTypeBadge";
import {
  formatNotificationDate,
  getNotificationTypeConfig,
  isUnreadNotification,
} from "@/components/notifications/notification-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/notification";

interface NotificationListProps {
  notifications: NotificationItem[];
  markingNotificationId?: number | null;
  onMarkAsRead?: (notification: NotificationItem) => void;
  compact?: boolean;
  emptyMessage: string;
}

export function NotificationList({
  notifications,
  markingNotificationId = null,
  onMarkAsRead,
  compact = false,
  emptyMessage,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const isUnread = isUnreadNotification(notification.status);
        const typeConfig = getNotificationTypeConfig(notification.type);

        return (
          <article
            key={notification.id}
            className={cn(
              "rounded-lg border border-border/80 bg-surface p-3 shadow-soft",
              isUnread && "border-primary/30 bg-primary/5",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <typeConfig.icon className="h-4 w-4" />
                  </span>
                  <NotificationTypeBadge type={notification.type} />
                  <Badge variant={isUnread ? "default" : "outline"}>{isUnread ? "Non lue" : "Lue"}</Badge>
                </div>
                <h3 className={cn("font-medium text-foreground", compact ? "text-sm" : "text-base")}>
                  {notification.title}
                </h3>
                <p className={cn("text-muted-foreground", compact ? "line-clamp-2 text-xs" : "text-sm")}>
                  {notification.message}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <p className="text-xs text-muted-foreground">{formatNotificationDate(notification.createdAt)}</p>
                {isUnread && onMarkAsRead ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={markingNotificationId === notification.id}
                    onClick={() => onMarkAsRead(notification)}
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Marquer lue
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
