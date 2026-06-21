import { CheckCircle2, Eye, Pencil, Play, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  WorkOrderPriorityBadge,
  WorkOrderStatusBadge,
  WorkOrderTypeBadge,
} from "@/components/work-orders/WorkOrderBadges";
import type { WorkOrder } from "@/types/work-order";

interface WorkOrderTableProps {
  workOrders: WorkOrder[];
  canManage: boolean;
  canStart: boolean;
  canClose: boolean;
  processingActionWorkOrderId: number | null;
  onView: (workOrder: WorkOrder) => void;
  onEdit: (workOrder: WorkOrder) => void;
  onAssign: (workOrder: WorkOrder) => void;
  onStart: (workOrder: WorkOrder) => void;
  onClose: (workOrder: WorkOrder) => void;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function WorkOrderTable({
  workOrders,
  canManage,
  canStart,
  canClose,
  processingActionWorkOrderId,
  onView,
  onEdit,
  onAssign,
  onStart,
  onClose,
}: WorkOrderTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Equipement</TableHead>
          <TableHead>Panne</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Priorite</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Technicien</TableHead>
          <TableHead>Date planifiee</TableHead>
          <TableHead className="sticky right-0 bg-secondary/95 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workOrders.map((workOrder) => (
          <TableRow key={workOrder.id}>
            <TableCell className="font-semibold">{workOrder.reference}</TableCell>
            <TableCell className="sticky right-0 bg-surface/95">
              <p className="text-sm text-foreground">{workOrder.equipmentCode}</p>
              <p className="text-xs text-muted-foreground">{workOrder.equipmentName}</p>
            </TableCell>
            <TableCell>{workOrder.breakdownReference ?? "-"}</TableCell>
            <TableCell>
              <WorkOrderTypeBadge type={workOrder.type} />
            </TableCell>
            <TableCell>
              <WorkOrderPriorityBadge priority={workOrder.priority} />
            </TableCell>
            <TableCell>
              <WorkOrderStatusBadge status={workOrder.status} />
            </TableCell>
            <TableCell>{workOrder.assignedTechnicianName ?? "-"}</TableCell>
            <TableCell>{formatDateTime(workOrder.plannedDate)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(workOrder)}
                  aria-label={`Voir les details de l'ordre de travail ${workOrder.reference}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {canManage ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(workOrder)}
                      aria-label={`Modifier l'ordre de travail ${workOrder.reference}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAssign(workOrder)}
                      aria-label={`Affecter un technicien a l'ordre de travail ${workOrder.reference}`}
                    >
                      <UserRoundPlus className="h-4 w-4" />
                    </Button>
                  </>
                ) : null}
                {canStart ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={processingActionWorkOrderId === workOrder.id || workOrder.status !== "ASSIGNED"}
                    onClick={() => onStart(workOrder)}
                    aria-label={`Demarrer l'ordre de travail ${workOrder.reference}`}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                ) : null}
                {canClose ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Cloturer avec rapport"
                    disabled={processingActionWorkOrderId === workOrder.id || workOrder.status !== "IN_PROGRESS"}
                    onClick={() => onClose(workOrder)}
                    aria-label={`Cloturer l'ordre de travail ${workOrder.reference} avec rapport`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
