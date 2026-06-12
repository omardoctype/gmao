import { apiGetData } from "@/services/api";
import { formatNumber } from "@/utils/format";
import type {
  DashboardCategoryPoint,
  DashboardCriticalStockApiItem,
  DashboardKpi,
  DashboardPerformancePoint,
  DashboardPriorityBreakdownApiItem,
  DashboardPriorityBreakdownItem,
  DashboardRecentWorkOrderApiItem,
  DashboardSnapshot,
  DashboardSummaryApiResponse,
  DashboardTrend,
  DashboardWorkOrderItem,
} from "@/types/dashboard";

const DASHBOARD_API_BASE = "/api/dashboard";
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const DAY_FORMATTER = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });

const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  CREATED: "Cree",
  ASSIGNED: "Assigne",
  IN_PROGRESS: "En cours",
  COMPLETED: "Cloture",
  CANCELLED: "Annule",
};

const BREAKDOWN_STATUS_LABELS: Record<string, string> = {
  DECLARED: "Declaree",
  QUALIFIED: "Qualifiee",
  IN_PROGRESS: "En cours",
  RESOLVED: "Resolue",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

export function getDashboardSummary(): Promise<DashboardSummaryApiResponse> {
  return apiGetData<DashboardSummaryApiResponse>(`${DASHBOARD_API_BASE}/summary`);
}

export function getDashboardRecentWorkOrders(limit = 5): Promise<DashboardRecentWorkOrderApiItem[]> {
  return apiGetData<DashboardRecentWorkOrderApiItem[]>(`${DASHBOARD_API_BASE}/recent-work-orders`, {
    params: { limit },
  });
}

export function getDashboardPriorityBreakdowns(limit = 5): Promise<DashboardPriorityBreakdownApiItem[]> {
  return apiGetData<DashboardPriorityBreakdownApiItem[]>(`${DASHBOARD_API_BASE}/priority-breakdowns`, {
    params: { limit },
  });
}

export function getDashboardCriticalStock(limit = 5): Promise<DashboardCriticalStockApiItem[]> {
  return apiGetData<DashboardCriticalStockApiItem[]>(`${DASHBOARD_API_BASE}/critical-stock`, {
    params: { limit },
  });
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [summary, recentWorkOrdersRaw, priorityBreakdownsRaw, criticalStockRaw] = await Promise.all([
    getDashboardSummary(),
    getDashboardRecentWorkOrders(6),
    getDashboardPriorityBreakdowns(6),
    getDashboardCriticalStock(6),
  ]);

  const recentWorkOrders = recentWorkOrdersRaw.map(mapRecentWorkOrder);
  const priorityBreakdowns = priorityBreakdownsRaw.map(mapPriorityBreakdown);

  return {
    updatedAt: DATE_TIME_FORMATTER.format(new Date()),
    kpis: toKpis(summary),
    performance: toPerformance(priorityBreakdownsRaw, recentWorkOrdersRaw),
    workloadByCategory: toWorkloadByCategory(recentWorkOrdersRaw),
    recentWorkOrders,
    priorityBreakdowns,
    criticalParts: criticalStockRaw.map((part) => ({
      id: String(part.id),
      reference: part.reference,
      name: part.name,
      availableQty: part.quantityInStock,
      minimumThreshold: part.minimumThreshold,
    })),
  };
}

function toKpis(summary: DashboardSummaryApiResponse): DashboardKpi[] {
  return [
    {
      id: "equipments",
      label: "Nombre d'equipements",
      value: formatNumber(summary.totalEquipments),
      helper: "Actifs industriels suivis",
      delta: "Donnees temps reel",
      trend: "neutral",
    },
    {
      id: "breakdowns",
      label: "Pannes ouvertes",
      value: formatNumber(summary.openBreakdowns),
      helper: "Incidents non resolus",
      delta: "Suivi continu",
      trend: summary.openBreakdowns > 0 ? "down" : "up",
    },
    {
      id: "work-orders",
      label: "Ordres en cours",
      value: formatNumber(summary.inProgressWorkOrders),
      helper: "Interventions en execution",
      delta: "Charge operationnelle",
      trend: "neutral",
    },
    {
      id: "critical-stock",
      label: "Stock critique",
      value: formatNumber(summary.criticalSpareParts),
      helper: "Pieces sous seuil minimum",
      delta: summary.criticalSpareParts > 0 ? "A surveiller" : "Sous controle",
      trend: summary.criticalSpareParts > 0 ? "down" : "up",
    },
  ];
}

function mapRecentWorkOrder(item: DashboardRecentWorkOrderApiItem): DashboardWorkOrderItem {
  const statusLabel = toWorkOrderStatusLabel(item.status);
  const technician = item.assignedTechnicianName?.trim() || "Non affecte";

  return {
    id: String(item.id),
    reference: item.reference,
    equipment: `${item.equipmentCode} - ${item.equipmentName}`,
    technician,
    status: statusLabel,
    statusTone: toWorkOrderStatusTone(item.status),
  };
}

function mapPriorityBreakdown(item: DashboardPriorityBreakdownApiItem): DashboardPriorityBreakdownItem {
  return {
    id: String(item.id),
    reference: item.reference,
    title: item.title,
    equipment: `${item.equipmentCode} - ${item.equipmentName}`,
    priority: toPriorityLabel(item.priority),
    status: toBreakdownStatusLabel(item.status),
  };
}

function toPerformance(
  breakdowns: DashboardPriorityBreakdownApiItem[],
  workOrders: DashboardRecentWorkOrderApiItem[],
): DashboardPerformancePoint[] {
  const days = getLastSevenDays();

  return days.map((day) => {
    const dayKey = toDateKey(day);
    const openedBreakdowns = breakdowns.filter((item) => toDateKey(item.declaredAt) === dayKey).length;
    const closedWorkOrders = workOrders.filter((item) => {
      return item.status === "COMPLETED" && toDateKey(item.createdAt) === dayKey;
    }).length;

    return {
      day: toDayLabel(day),
      openedBreakdowns,
      closedWorkOrders,
    };
  });
}

function toWorkloadByCategory(workOrders: DashboardRecentWorkOrderApiItem[]): DashboardCategoryPoint[] {
  const priorityBuckets: Array<{ key: string; label: string }> = [
    { key: "CRITICAL", label: "Crit." },
    { key: "HIGH", label: "Haute" },
    { key: "MEDIUM", label: "Moy." },
    { key: "LOW", label: "Basse" },
  ];

  return priorityBuckets
    .map((bucket) => ({
      category: bucket.label,
      workOrders: workOrders.filter((item) => item.priority === bucket.key).length,
    }))
    .filter((point) => point.workOrders > 0);
}

function toWorkOrderStatusLabel(status: string): string {
  return WORK_ORDER_STATUS_LABELS[status] ?? toSentenceCase(status);
}

function toBreakdownStatusLabel(status: string): string {
  return BREAKDOWN_STATUS_LABELS[status] ?? toSentenceCase(status);
}

function toPriorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] ?? toSentenceCase(priority);
}

function toWorkOrderStatusTone(status: string): DashboardTrend {
  if (status === "COMPLETED") {
    return "up";
  }

  if (status === "CANCELLED") {
    return "down";
  }

  return "neutral";
}

function toSentenceCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getLastSevenDays(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    days.push(day);
  }

  return days;
}

function toDateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function toDayLabel(date: Date): string {
  const rawLabel = DAY_FORMATTER.format(date).replace(".", "");
  return rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
}
