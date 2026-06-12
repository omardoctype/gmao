import { Badge } from "@/components/ui/badge";
import type { BreakdownPriority, BreakdownStatus, BreakdownType } from "@/types/breakdown";

export function breakdownStatusLabel(status: BreakdownStatus): string {
  if (status === "DECLARED") {
    return "Declaree";
  }

  if (status === "QUALIFIED") {
    return "Qualifiee";
  }

  if (status === "IN_PROGRESS") {
    return "En cours";
  }

  return "Resolue";
}

export function breakdownPriorityLabel(priority: BreakdownPriority): string {
  if (priority === "LOW") {
    return "Faible";
  }

  if (priority === "MEDIUM") {
    return "Moyenne";
  }

  if (priority === "HIGH") {
    return "Haute";
  }

  return "Critique";
}

export function breakdownTypeLabel(type: BreakdownType): string {
  if (type === "MECHANICAL") {
    return "Mecanique";
  }

  if (type === "ELECTRICAL") {
    return "Electrique";
  }

  if (type === "HYDRAULIC") {
    return "Hydraulique";
  }

  if (type === "PNEUMATIC") {
    return "Pneumatique";
  }

  if (type === "SOFTWARE") {
    return "Logicielle";
  }

  return "Autre";
}

export function BreakdownStatusBadge({ status }: { status: BreakdownStatus }) {
  if (status === "RESOLVED") {
    return <Badge variant="success">{breakdownStatusLabel(status)}</Badge>;
  }

  if (status === "IN_PROGRESS") {
    return <Badge variant="default">{breakdownStatusLabel(status)}</Badge>;
  }

  if (status === "QUALIFIED") {
    return <Badge variant="secondary">{breakdownStatusLabel(status)}</Badge>;
  }

  return <Badge variant="outline">{breakdownStatusLabel(status)}</Badge>;
}

export function BreakdownPriorityBadge({ priority }: { priority: BreakdownPriority }) {
  if (priority === "CRITICAL") {
    return <Badge variant="destructive">{breakdownPriorityLabel(priority)}</Badge>;
  }

  if (priority === "HIGH") {
    return <Badge variant="warning">{breakdownPriorityLabel(priority)}</Badge>;
  }

  if (priority === "MEDIUM") {
    return <Badge variant="secondary">{breakdownPriorityLabel(priority)}</Badge>;
  }

  return <Badge variant="outline">{breakdownPriorityLabel(priority)}</Badge>;
}

export function BreakdownTypeBadge({ type }: { type: BreakdownType }) {
  return <Badge variant="outline">{breakdownTypeLabel(type)}</Badge>;
}
