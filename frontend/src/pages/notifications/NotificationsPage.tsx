import { useEffect, useState } from "react";
import { BellRing, RefreshCw } from "lucide-react";
import { NotificationList } from "@/components/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterActions, FilterCard, FilterField, FilterGrid } from "@/components/ui/list-query-controls";
import { PageEmptyState, PageErrorState, PageLoadingState } from "@/components/ui/page-states";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/toast-context";
import { getApiErrorMessage } from "@/services/api";
import { getNotifications, getUnreadNotifications, markNotificationAsRead } from "@/services/notification-service";
import type { NotificationItem } from "@/types/notification";

type NotificationPageMode = "UNREAD" | "ALL";

export function NotificationsPage() {
  const [mode, setMode] = useState<NotificationPageMode>("UNREAD");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [markingNotificationId, setMarkingNotificationId] = useState<number | null>(null);
  const toast = useToast();

  const resetFilters = () => {
    setMode("UNREAD");
  };

  async function refreshUnreadCount() {
    try {
      const unreadNotifications = await getUnreadNotifications();
      setUnreadCount(unreadNotifications.length);
    } catch {
      setUnreadCount(0);
    }
  }

  async function refreshNotifications(showLoader: boolean, targetMode = mode) {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const data = targetMode === "UNREAD" ? await getUnreadNotifications() : await getNotifications();
      setNotifications(data);
      setListError(null);
    } catch (error) {
      setListError(getApiErrorMessage(error, "Impossible de charger les notifications."));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
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
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de marquer la notification comme lue."));
    } finally {
      setMarkingNotificationId(null);
    }
  }

  useEffect(() => {
    void refreshNotifications(true);
    void refreshUnreadCount();
  }, [mode]);

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Notifications</h1>
          <p>Suivi des alertes metier critiques: stock, pannes et ordres de travail en retard.</p>
        </div>
      </div>

      <FilterCard
        title="Filtres"
        description="Selectionner l'etat d'affichage des notifications et actualiser la liste."
      >
        <CardContent className="space-y-3">
          <FilterGrid columns={3}>
            <FilterField label="Affichage">
              <Select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as NotificationPageMode);
                }}
              >
                <option value="UNREAD">Non lues ({unreadCount})</option>
                <option value="ALL">Toutes</option>
              </Select>
            </FilterField>
          </FilterGrid>
          <FilterActions>
            <Button variant="outline" onClick={resetFilters}>
              Reinitialiser
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void refreshNotifications(true, mode);
                void refreshUnreadCount();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </FilterActions>
        </CardContent>
      </FilterCard>

      {listError ? (
        <PageErrorState description={listError} onRetry={() => void refreshNotifications(true, mode)} />
      ) : loading ? (
        <PageLoadingState title="Chargement des notifications..." description="Recuperation des alertes metier." />
      ) : notifications.length === 0 ? (
        <PageEmptyState
          title={mode === "UNREAD" ? "Aucune notification non lue" : "Aucune notification"}
          description="Le systeme ne signale actuellement aucune alerte metier."
          icon={BellRing}
        />
      ) : (
        <Card className="border-border/90 bg-surface">
          <CardHeader>
            <CardTitle>Centre de notifications</CardTitle>
            <CardDescription>{notifications.length} notification(s) affichee(s).</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationList
              notifications={notifications}
              markingNotificationId={markingNotificationId}
              onMarkAsRead={handleMarkAsRead}
              emptyMessage={
                mode === "UNREAD" ? "Aucune notification non lue pour le moment." : "Aucune notification trouvee."
              }
            />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
