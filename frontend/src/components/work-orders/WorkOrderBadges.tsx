import { Badge } from "@/components/ui/badge";
import type { WorkOrderPriority, WorkOrderStatus, WorkOrderType } from "@/types/work-order";

export function workOrderStatusLabel(status: WorkOrderStatus): string {
  if (status === "CREATED") {
    return "Cree";
  }

  if (status === "ASSIGNED") {
    return "Affecte";
  }

  if (status === "ACCEPTED") {
    return "Pris en charge";
  }

  if (status === "IN_PROGRESS") {
    return "En cours";
  }

  if (status === "COMPLETED") {
    return "Cloture";
  }

  return "Annule";
}

export function workOrderPriorityLabel(priority: WorkOrderPriority): string {
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

export function workOrderTypeLabel(type: WorkOrderType): string {
  if (type === "CORRECTIVE") {
    return "Corrective";
  }

  if (type === "PREVENTIVE") {
    return "Preventive";
  }

  if (type === "INSPECTION") {
    return "Inspection";
  }

  if (type === "INSTALLATION") {
    return "Installation";
  }

  return "Autre";
}

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  if (status === "COMPLETED") {
    return <Badge variant="success">{workOrderStatusLabel(status)}</Badge>;
  }

  if (status === "CANCELLED") {
    return <Badge variant="destructive">{workOrderStatusLabel(status)}</Badge>;
  }

  if (status === "IN_PROGRESS") {
    return <Badge variant="default">{workOrderStatusLabel(status)}</Badge>;
  }

  if (status === "ACCEPTED") {
    return <Badge variant="secondary">{workOrderStatusLabel(status)}</Badge>;
  }

  if (status === "ASSIGNED") {
    return <Badge variant="secondary">{workOrderStatusLabel(status)}</Badge>;
  }

  return <Badge variant="outline">{workOrderStatusLabel(status)}</Badge>;
}

export function WorkOrderPriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  if (priority === "CRITICAL") {
    return <Badge variant="destructive">{workOrderPriorityLabel(priority)}</Badge>;
  }

  if (priority === "HIGH") {
    return <Badge variant="warning">{workOrderPriorityLabel(priority)}</Badge>;
  }

  if (priority === "MEDIUM") {
    return <Badge variant="secondary">{workOrderPriorityLabel(priority)}</Badge>;
  }

  return <Badge variant="outline">{workOrderPriorityLabel(priority)}</Badge>;
}

export function WorkOrderTypeBadge({ type }: { type: WorkOrderType }) {
  return <Badge variant="outline">{workOrderTypeLabel(type)}</Badge>;
}
