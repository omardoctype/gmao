import type { AiSource } from "@/types/ai-assistant";
import type { EquipmentCriticality, EquipmentStatus } from "@/types/equipment";

export type PredictiveRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface PredictiveRiskReason {
  criterion: string;
  detail: string;
  points: number;
}

export interface PredictiveRiskEquipment {
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
  category: string;
  location: string | null;
  criticality: EquipmentCriticality;
  status: EquipmentStatus;
  riskScore: number;
  riskLevel: PredictiveRiskLevel;
  reasons: PredictiveRiskReason[];
  recommendedAction: string;
}

export interface PredictiveDashboardSummary {
  lowCount: number;
  mediumCount: number;
  highCount: number;
  criticalCount: number;
  averageRiskScore: number;
  topRiskEquipments: PredictiveRiskEquipment[];
}

export interface PredictiveRagAnalysisResponse {
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
  riskScore: number;
  riskLevel: PredictiveRiskLevel;
  riskReasons: string[];
  predictiveRecommendedAction: string;
  ragAnalysis: string;
  sources: AiSource[];
}
