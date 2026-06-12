import { Badge } from "@/components/ui/badge";
import type { MaintenancePlanFrequency, MaintenancePlanType } from "@/types/maintenance-plan";

export function maintenancePlanTypeLabel(type: MaintenancePlanType): string {
  if (type === "PREVENTIVE") {
    return "Preventif";
  }

  if (type === "PREDICTIVE") {
    return "Predictif";
  }

  if (type === "LEGAL") {
    return "Reglementaire";
  }

  if (type === "CONDITION_BASED") {
    return "Conditionnel";
  }

  return "Autre";
}

export function maintenancePlanFrequencyLabel(frequency: MaintenancePlanFrequency): string {
  if (frequency === "DAILY") {
    return "Quotidienne";
  }

  if (frequency === "WEEKLY") {
    return "Hebdomadaire";
  }

  if (frequency === "MONTHLY") {
    return "Mensuelle";
  }

  if (frequency === "QUARTERLY") {
    return "Trimestrielle";
  }

  if (frequency === "SEMI_ANNUAL") {
    return "Semestrielle";
  }

  return "Annuelle";
}

export function MaintenancePlanTypeBadge({ type }: { type: MaintenancePlanType }) {
  if (type === "LEGAL") {
    return <Badge variant="warning">{maintenancePlanTypeLabel(type)}</Badge>;
  }

  if (type === "PREDICTIVE") {
    return <Badge variant="secondary">{maintenancePlanTypeLabel(type)}</Badge>;
  }

  if (type === "CONDITION_BASED") {
    return <Badge variant="outline">{maintenancePlanTypeLabel(type)}</Badge>;
  }

  if (type === "OTHER") {
    return <Badge variant="outline">{maintenancePlanTypeLabel(type)}</Badge>;
  }

  return <Badge variant="default">{maintenancePlanTypeLabel(type)}</Badge>;
}

export function MaintenancePlanFrequencyBadge({ frequency }: { frequency: MaintenancePlanFrequency }) {
  if (frequency === "DAILY") {
    return <Badge variant="destructive">{maintenancePlanFrequencyLabel(frequency)}</Badge>;
  }

  if (frequency === "WEEKLY" || frequency === "MONTHLY") {
    return <Badge variant="warning">{maintenancePlanFrequencyLabel(frequency)}</Badge>;
  }

  return <Badge variant="secondary">{maintenancePlanFrequencyLabel(frequency)}</Badge>;
}
