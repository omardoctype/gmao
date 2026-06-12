export type MaintenancePlanType = "PREVENTIVE" | "PREDICTIVE" | "LEGAL" | "CONDITION_BASED" | "OTHER";

export type MaintenancePlanFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";

export interface MaintenancePlan {
  id: number;
  type: MaintenancePlanType;
  frequency: MaintenancePlanFrequency;
  nextExecutionDate: string;
  description: string;
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
}

export interface MaintenancePlanPayload {
  type: MaintenancePlanType;
  frequency: MaintenancePlanFrequency;
  nextExecutionDate: string;
  description: string;
  equipmentId: number;
}
