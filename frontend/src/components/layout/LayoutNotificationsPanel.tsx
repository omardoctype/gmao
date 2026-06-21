import { useEffect, useRef, useState } from "react";
import { Bell, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { NotificationList } from "@/components/notifications";
import { Button } from "@/components/ui/button";
import { AnchoredPopover } from "@/components/ui/overlay";
import { useToast } from "@/context/toast-context";
import { cn } from "@/lib/utils";
import { routePaths } from "@/routes/route-paths";
import { getApiErrorMessage } from "@/services/api";
import { getNotifications, getUnreadNotifications, markNotificationAsRead } from "@/services/notification-service";
import type { NotificationItem } from "@/types/notification";

type NotificationPanelMode = "UNREAD" | "ALL";

export function LayoutNotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<NotificationPanelMode>("UNREAD");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingNotificationId, setMarkingNotificationId] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const toast = useToast();

  async function refreshUnreadCount() {
    try {
      const unreadNotifications = await getUnreadNotifications();
      setUnreadCount(unreadNotifications.length);
    } catch {
      setUnreadCount(0);
    }
  }

  async function refreshNotifications(targetMode = mode) {
    setLoading(true);

    try {
      const data = targetMode === "UNREAD" ? await getUnreadNotifications() : await getNotifications();
      setNotifications(data);
      setError(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Impossible de charger les notifications."));
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notification: NotificationItem) {
    setMarkingNotificationId(notification.id);

    try {
      await markNotificationAsRead(notification.id);
      toast.success("Notification marquee comme lue.");

      if (mode === "UNREAD") {
        setNotifications((currentNotifications) => currentNotifications.filter((item) => item.id !== notification.id));
      } else {
        setNotifications((currentNotifications) =>
          currentNotifications.map((item) => (item.id === notification.id ? { ...item, status: "READ" } : item)),
        );
      }

      await refreshUnreadCount();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, "Impossible de marquer la notification comme lue."));
    } finally {
      setMarkingNotificationId(null);
    }
  }

  useEffect(() => {
    void refreshUnreadCount();
    const intervalId = window.setInterval(() => {
      void refreshUnreadCount();
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    void refreshNotifications(mode);
  }, [open, mode]);

  return (
    <div>
      <Button
        ref={triggerRef}
        variant="outline"
        size="icon"
        className="relative h-11 w-11"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Ouvrir les notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Button>

      <AnchoredPopover
        open={open}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
        className="w-[min(92vw,26rem)] rounded-xl p-3"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-xs text-muted-foreground">{unreadCount} non lue(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => {
                void refreshNotifications(mode);
                void refreshUnreadCount();
              }}
              aria-label="Actualiser les notifications"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
            <Link to={routePaths.notifications} onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="h-8 px-2.5">
                Ouvrir
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <Button
            variant={mode === "UNREAD" ? "default" : "outline"}
            size="sm"
            className="h-8"
            onClick={() => setMode("UNREAD")}
          >
            Non lues
          </Button>
          <Button
            variant={mode === "ALL" ? "default" : "outline"}
            size="sm"
            className="h-8"
            onClick={() => setMode("ALL")}
          >
            Toutes
          </Button>
        </div>

        <div className="max-h-[24rem] overflow-y-auto pr-1">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Chargement des notifications...</p>
          ) : (
            <NotificationList
              notifications={notifications}
              markingNotificationId={markingNotificationId}
              onMarkAsRead={handleMarkAsRead}
              compact
              emptyMessage={
                mode === "UNREAD" ? "Aucune notification non lue pour le moment." : "Aucune notification trouvee."
              }
            />
          )}
        </div>
      </AnchoredPopover>
    </div>
  );
}
