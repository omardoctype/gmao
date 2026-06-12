import { Badge } from "@/components/ui/badge";
import type { EquipmentCriticality, EquipmentStatus } from "@/types/equipment";
import type { PredictiveRiskLevel } from "@/types/predictive-maintenance";

export function equipmentStatusLabel(status: EquipmentStatus): string {
  if (status === "OPERATIONAL") {
    return "Operationnel";
  }
  if (status === "MAINTENANCE") {
    return "Maintenance";
  }
  return "Hors service";
}

export function equipmentCriticalityLabel(criticality: EquipmentCriticality): string {
  if (criticality === "LOW") {
    return "Faible";
  }
  if (criticality === "MEDIUM") {
    return "Moyenne";
  }
  if (criticality === "HIGH") {
    return "Haute";
  }
  return "Critique";
}

export function predictiveRiskLevelLabel(riskLevel: PredictiveRiskLevel): string {
  if (riskLevel === "LOW") {
    return "LOW";
  }
  if (riskLevel === "MEDIUM") {
    return "MEDIUM";
  }
  if (riskLevel === "HIGH") {
    return "HIGH";
  }
  return "CRITICAL";
}

function equipmentStatusVariant(status: EquipmentStatus) {
  if (status === "OPERATIONAL") {
    return "success" as const;
  }
  if (status === "MAINTENANCE") {
    return "warning" as const;
  }
  return "destructive" as const;
}

function equipmentCriticalityVariant(criticality: EquipmentCriticality) {
  if (criticality === "LOW") {
    return "secondary" as const;
  }
  if (criticality === "MEDIUM") {
    return "outline" as const;
  }
  if (criticality === "HIGH") {
    return "warning" as const;
  }
  return "destructive" as const;
}

function predictiveRiskLevelVariant(riskLevel: PredictiveRiskLevel) {
  if (riskLevel === "LOW") {
    return "success" as const;
  }
  if (riskLevel === "MEDIUM") {
    return "secondary" as const;
  }
  if (riskLevel === "HIGH") {
    return "warning" as const;
  }
  return "destructive" as const;
}

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  return <Badge variant={equipmentStatusVariant(status)}>{equipmentStatusLabel(status)}</Badge>;
}

export function EquipmentCriticalityBadge({ criticality }: { criticality: EquipmentCriticality }) {
  return <Badge variant={equipmentCriticalityVariant(criticality)}>{equipmentCriticalityLabel(criticality)}</Badge>;
}

export function PredictiveRiskLevelBadge({ riskLevel }: { riskLevel: PredictiveRiskLevel }) {
  return <Badge variant={predictiveRiskLevelVariant(riskLevel)}>{predictiveRiskLevelLabel(riskLevel)}</Badge>;
}
