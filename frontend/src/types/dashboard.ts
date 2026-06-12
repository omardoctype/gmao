export type DashboardTrend = "up" | "down" | "neutral";

export interface DashboardSummaryApiResponse {
  totalEquipments: number;
  openBreakdowns: number;
  inProgressWorkOrders: number;
  criticalSpareParts: number;
}

export interface DashboardRecentWorkOrderApiItem {
  id: number;
  reference: string;
  status: string;
  priority: string;
  createdAt: string;
  equipmentCode: string;
  equipmentName: string;
  assignedTechnicianName: string | null;
}

export interface DashboardPriorityBreakdownApiItem {
  id: number;
  reference: string;
  title: string;
  priority: string;
  status: string;
  declaredAt: string;
  equipmentCode: string;
  equipmentName: string;
}

export interface DashboardCriticalStockApiItem {
  id: number;
  reference: string;
  name: string;
  category: string;
  quantityInStock: number;
  minimumThreshold: number;
  unitPrice: number;
}

export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  helper: string;
  delta: string;
  trend: DashboardTrend;
}

export interface DashboardPerformancePoint {
  day: string;
  openedBreakdowns: number;
  closedWorkOrders: number;
}

export interface DashboardCategoryPoint {
  category: string;
  workOrders: number;
}

export interface DashboardWorkOrderItem {
  id: string;
  reference: string;
  equipment: string;
  technician: string;
  status: string;
  statusTone: DashboardTrend;
}

export interface DashboardPriorityBreakdownItem {
  id: string;
  reference: string;
  title: string;
  equipment: string;
  priority: string;
  status: string;
}

export interface DashboardCriticalPartItem {
  id: string;
  reference: string;
  name: string;
  availableQty: number;
  minimumThreshold: number;
}

export interface DashboardSnapshot {
  updatedAt: string;
  kpis: DashboardKpi[];
  performance: DashboardPerformancePoint[];
  workloadByCategory: DashboardCategoryPoint[];
  recentWorkOrders: DashboardWorkOrderItem[];
  priorityBreakdowns: DashboardPriorityBreakdownItem[];
  criticalParts: DashboardCriticalPartItem[];
}
