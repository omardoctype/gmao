import { CheckCircle2, Eye, Hand, LoaderCircle, Pencil, Play, UserRoundPlus } from "lucide-react";
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
  canInterventionAction: boolean;
  currentUserId: number | string | null;
  processingActionWorkOrderId: number | null;
  onView: (workOrder: WorkOrder) => void;
  onEdit: (workOrder: WorkOrder) => void;
  onAssign: (workOrder: WorkOrder) => void;
  onAccept: (workOrder: WorkOrder) => void;
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
  canInterventionAction,
  currentUserId,
  processingActionWorkOrderId,
  onView,
  onEdit,
  onAssign,
  onAccept,
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
        {workOrders.map((workOrder) => {
          const assignedToCurrentUser =
            canInterventionAction &&
            currentUserId !== null &&
            workOrder.assignedTechnicianId !== null &&
            String(workOrder.assignedTechnicianId) === String(currentUserId);
          const isProcessing = processingActionWorkOrderId === workOrder.id;

          return (
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
                  {assignedToCurrentUser && workOrder.status === "ASSIGNED" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => onAccept(workOrder)}
                      aria-label={`Prendre en charge l'ordre de travail ${workOrder.reference}`}
                    >
                      {isProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Hand className="h-4 w-4" />}
                    </Button>
                  ) : null}
                  {assignedToCurrentUser && workOrder.status === "ACCEPTED" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => onStart(workOrder)}
                      aria-label={`Demarrer l'intervention ${workOrder.reference}`}
                    >
                      {isProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    </Button>
                  ) : null}
                  {assignedToCurrentUser && workOrder.status === "IN_PROGRESS" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Terminer avec rapport"
                      disabled={isProcessing}
                      onClick={() => onClose(workOrder)}
                      aria-label={`Terminer l'intervention ${workOrder.reference} avec rapport`}
                    >
                      {isProcessing ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
