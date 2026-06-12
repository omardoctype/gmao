import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, Boxes, ClipboardList, Gauge, PackageSearch, RefreshCw, Siren, Wrench } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardKpiCard, DashboardSectionCard, DashboardStatusPill } from "@/components/dashboard";
import { filterNotificationsByType } from "@/components/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageEmptyState, PageErrorState, PageLoadingState } from "@/components/ui/page-states";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/services/api";
import { getDashboardSnapshot } from "@/services/dashboard-service";
import { getUnreadNotifications } from "@/services/notification-service";
import type { DashboardKpi, DashboardPriorityBreakdownItem, DashboardSnapshot } from "@/types/dashboard";
import type { NotificationItem } from "@/types/notification";

const KPI_ICONS: Record<string, typeof Gauge> = {
  equipments: Gauge,
  breakdowns: AlertTriangle,
  "work-orders": Wrench,
  "critical-stock": Boxes,
};

function getKpiIcon(metric: DashboardKpi) {
  return KPI_ICONS[metric.id] ?? Gauge;
}

function getPriorityTone(item: DashboardPriorityBreakdownItem) {
  const normalizedPriority = item.priority.trim().toLowerCase();

  if (normalizedPriority.includes("critique") || normalizedPriority.includes("critical")) {
    return "destructive" as const;
  }

  if (normalizedPriority.includes("haute") || normalizedPriority.includes("high")) {
    return "warning" as const;
  }

  return "secondary" as const;
}

function getCriticalityPercent(availableQty: number, minimumThreshold: number): number {
  if (minimumThreshold <= 0) {
    return 100;
  }

  const ratio = (availableQty / minimumThreshold) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
}

function hasPerformanceData(snapshot: DashboardSnapshot): boolean {
  return snapshot.performance.some((point) => point.openedBreakdowns > 0 || point.closedWorkOrders > 0);
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<NotificationItem[]>([]);

  const criticalStockNotifications = useMemo(
    () => filterNotificationsByType(unreadNotifications, "CRITICAL_STOCK"),
    [unreadNotifications],
  );
  const criticalBreakdownNotifications = useMemo(
    () => filterNotificationsByType(unreadNotifications, "CRITICAL_BREAKDOWN"),
    [unreadNotifications],
  );
  const overdueWorkOrderNotifications = useMemo(
    () => filterNotificationsByType(unreadNotifications, "OVERDUE_WORK_ORDER"),
    [unreadNotifications],
  );
  const criticalAlertCount =
    criticalStockNotifications.length + criticalBreakdownNotifications.length + overdueWorkOrderNotifications.length;

  async function fetchDashboardData() {
    const snapshotData = await getDashboardSnapshot();
    const unreadData = await getUnreadNotifications().catch(() => []);
    return { snapshotData, unreadData };
  }

  async function loadDashboard(showLoader = true) {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      const { snapshotData, unreadData } = await fetchDashboardData();
      setSnapshot(snapshotData);
      setUnreadNotifications(unreadData);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Impossible de charger les indicateurs dashboard."));
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    void loadDashboard(true);
  }, []);

  if (loading) {
    return (
      <section className="ds-stack animate-fade-in-up">
        <PageLoadingState
          title="Chargement du dashboard..."
          description="Preparation des indicateurs maintenance et des syntheses operationnelles."
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="ds-stack animate-fade-in-up">
        <PageErrorState description={error} onRetry={() => void loadDashboard()} />
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="ds-stack animate-fade-in-up">
        <PageLoadingState
          title="Chargement du dashboard..."
          description="Preparation des indicateurs maintenance et des syntheses operationnelles."
        />
      </section>
    );
  }

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Dashboard Maintenance</h1>
          <p>Pilotage global de la performance maintenance et de la disponibilite des actifs industriels.</p>
        </div>
        <div className="ds-button-group">
          <Button variant="outline" onClick={() => void loadDashboard(false)} disabled={refreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Actualiser
          </Button>
          <Badge variant="outline">Mise a jour: {snapshot.updatedAt}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot.kpis.map((metric) => (
          <DashboardKpiCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            delta={metric.delta}
            trend={metric.trend}
            icon={getKpiIcon(metric)}
          />
        ))}
      </div>

      <Card
        className={cn(
          "border-border/90 bg-surface",
          criticalAlertCount > 0 && "border-warning/35 bg-warning/5",
        )}
      >
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-elevated">
              <BellRing className="h-4 w-4 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Alertes critiques non lues</p>
              <p className="text-xs text-muted-foreground">
                {criticalAlertCount > 0
                  ? `${criticalAlertCount} alerte(s) a traiter.`
                  : "Aucune alerte critique en attente."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={criticalStockNotifications.length > 0 ? "warning" : "outline"}>
              Stock: {criticalStockNotifications.length}
            </Badge>
            <Badge variant={criticalBreakdownNotifications.length > 0 ? "destructive" : "outline"}>
              Pannes: {criticalBreakdownNotifications.length}
            </Badge>
            <Badge variant={overdueWorkOrderNotifications.length > 0 ? "secondary" : "outline"}>
              OT retard: {overdueWorkOrderNotifications.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <DashboardSectionCard
          title="Tendance hebdomadaire"
          description="Pannes ouvertes vs ordres de travail clotures"
          icon={ClipboardList}
          className="xl:col-span-8"
        >
          {hasPerformanceData(snapshot) ? (
            <div className="h-[300px] min-h-[300px] w-full min-w-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={280}
                minHeight={300}
                initialDimension={{ width: 520, height: 300 }}
              >
                <LineChart data={snapshot.performance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={30} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="openedBreakdowns"
                    stroke="hsl(var(--warning))"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Pannes ouvertes"
                  />
                  <Line
                    type="monotone"
                    dataKey="closedWorkOrders"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="OT clotures"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <PageEmptyState
              title="Pas assez d'historique"
              description="La courbe s'alimentera automatiquement des qu'il y aura des evenements recents."
            />
          )}
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Charge par categorie"
          description="Repartition des OT recents par niveau de priorite"
          icon={Wrench}
          className="xl:col-span-4"
        >
          {snapshot.workloadByCategory.length > 0 ? (
            <div className="h-[300px] min-h-[300px] w-full min-w-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={280}
                minHeight={300}
                initialDimension={{ width: 520, height: 300 }}
              >
                <BarChart data={snapshot.workloadByCategory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={25} />
                  <Tooltip />
                  <Bar dataKey="workOrders" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} name="OT recents" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <PageEmptyState
              title="Aucune charge disponible"
              description="Les ordres de travail recents seront affiches ici des qu'ils sont disponibles."
            />
          )}
        </DashboardSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <DashboardSectionCard
          title="OT recents"
          description="Dernieres interventions en suivi"
          icon={ClipboardList}
          className="xl:col-span-4"
        >
          <div className="space-y-3">
            {snapshot.recentWorkOrders.length > 0 ? (
              snapshot.recentWorkOrders.map((item) => (
                <div key={item.id} className="rounded-lg border border-border/80 bg-surface-elevated px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.reference}</p>
                      <p className="text-xs text-muted-foreground">{item.equipment}</p>
                      <p className="text-xs text-muted-foreground">Tech: {item.technician}</p>
                    </div>
                    <DashboardStatusPill label={item.status} tone={item.statusTone} />
                  </div>
                </div>
              ))
            ) : (
              <PageEmptyState
                title="Aucun ordre recent"
                description="Les derniers ordres de travail apparaitront ici."
              />
            )}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Pannes prioritaires"
          description="Incidents critiques a traiter rapidement"
          icon={Siren}
          className="xl:col-span-4"
        >
          <div className="space-y-3">
            {snapshot.priorityBreakdowns.length > 0 ? (
              snapshot.priorityBreakdowns.map((item) => (
                <div key={item.id} className="rounded-lg border border-border/80 bg-surface-elevated px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{item.reference}</p>
                    <Badge variant={getPriorityTone(item)}>{item.priority}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.equipment} - {item.status}
                  </p>
                </div>
              ))
            ) : (
              <PageEmptyState
                title="Aucune panne prioritaire"
                description="Les pannes critiques ou hautes priorites seront listees ici."
              />
            )}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Pieces en seuil critique"
          description="Stocks proches du minimum avec mise en evidence des seuils atteints"
          icon={PackageSearch}
          className="xl:col-span-4"
        >
          <div className="space-y-3">
            {criticalStockNotifications.length > 0 ? (
              <div className="rounded-lg border border-warning/35 bg-warning/10 px-3 py-2">
                <p className="text-xs text-warning">
                  {criticalStockNotifications.length} notification(s) stock critique non lue(s).
                </p>
              </div>
            ) : null}
            {snapshot.criticalParts.length > 0 ? (
              snapshot.criticalParts.map((part) => {
                const percent = getCriticalityPercent(part.availableQty, part.minimumThreshold);
                const isCritical = part.availableQty <= part.minimumThreshold;
                const barToneClass =
                  percent <= 35 ? "bg-destructive" : percent <= 60 ? "bg-warning" : "bg-success";

                return (
                  <div
                    key={part.id}
                    className={cn(
                      "rounded-lg border border-border/80 bg-surface-elevated px-3 py-2.5",
                      isCritical && "border-destructive/30 bg-destructive/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{part.reference}</p>
                        <p className="text-xs text-muted-foreground">{part.name}</p>
                      </div>
                      <Badge variant={isCritical ? "destructive" : "warning"}>
                        {part.availableQty}/{part.minimumThreshold}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isCritical ? "Seuil minimum atteint ou depasse." : "Stock proche du seuil minimum."}
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${barToneClass}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <PageEmptyState
                title="Aucun stock critique"
                description="Les pieces sous seuil minimum seront affichees ici."
              />
            )}
          </div>
        </DashboardSectionCard>
      </div>
    </section>
  );
}
