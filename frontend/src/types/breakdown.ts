export type BreakdownType =
  | "MECHANICAL"
  | "ELECTRICAL"
  | "HYDRAULIC"
  | "PNEUMATIC"
  | "SOFTWARE"
  | "OTHER";

export type BreakdownPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type BreakdownStatus = "DECLARED" | "QUALIFIED" | "IN_PROGRESS" | "RESOLVED";

export interface Breakdown {
  id: number;
  reference: string;
  title: string;
  description: string;
  type: BreakdownType;
  priority: BreakdownPriority;
  status: BreakdownStatus;
  declaredAt: string;
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
}

export interface BreakdownPayload {
  reference: string;
  title: string;
  description: string;
  type: BreakdownType;
  priority: BreakdownPriority;
  status: BreakdownStatus;
  equipmentId: number;
}

export interface BreakdownStatusPayload {
  status: BreakdownStatus;
}
