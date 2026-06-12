import type { EquipmentDocument } from "@/types/equipment";

export type WorkOrderType = "CORRECTIVE" | "PREVENTIVE" | "INSPECTION" | "INSTALLATION" | "OTHER";

export type WorkOrderStatus = "CREATED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface WorkOrder {
  id: number;
  reference: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  createdAt: string;
  plannedDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  estimatedCost: number | null;
  realCost: number | null;
  description: string;
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
  breakdownId: number | null;
  breakdownReference: string | null;
  assignedTechnicianId: number | null;
  assignedTechnicianName: string | null;
}

export interface WorkOrderPayload {
  reference: string;
  type: WorkOrderType;
  status?: WorkOrderStatus;
  priority: WorkOrderPriority;
  plannedDate?: string | null;
  estimatedCost?: number | null;
  realCost?: number | null;
  description: string;
  equipmentId: number;
  breakdownId?: number | null;
}

export interface InterventionReportPayload {
  performedTasks: string;
  realDiagnosis?: string | null;
  rootCause?: string | null;
  usedParts?: string | null;
  interventionDurationMinutes?: number | null;
  finalResult: string;
  futureRecommendations?: string | null;
}

export interface InterventionReport {
  id: number;
  workOrderId: number;
  workOrderReference: string;
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
  breakdownId: number | null;
  breakdownReference: string | null;
  technicianId: number;
  technicianName: string;
  performedTasks: string;
  realDiagnosis: string | null;
  rootCause: string | null;
  usedParts: string | null;
  interventionDurationMinutes: number | null;
  finalResult: string;
  futureRecommendations: string | null;
  createdAt: string | null;
  closedAt: string;
  equipmentDocument: EquipmentDocument | null;
}
