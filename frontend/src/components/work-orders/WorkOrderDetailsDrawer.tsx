import {
  CalendarClock,
  CheckCircle2,
  FileCog,
  Gauge,
  Hand,
  LoaderCircle,
  Play,
  ReceiptText,
  Timer,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveSidePanel } from "@/components/ui/overlay";
import {
  WorkOrderPriorityBadge,
  WorkOrderStatusBadge,
  WorkOrderTypeBadge,
} from "@/components/work-orders/WorkOrderBadges";
import { WorkOrderStatusTimeline } from "@/components/work-orders/WorkOrderStatusTimeline";
import type { WorkOrder } from "@/types/work-order";

interface WorkOrderDetailsDrawerProps {
  open: boolean;
  loading: boolean;
  workOrder: WorkOrder | null;
  currentUserId: number | string | null;
  processingActionWorkOrderId: number | null;
  onClose: () => void;
  onAccept: (workOrder: WorkOrder) => void;
  onStart: (workOrder: WorkOrder) => void;
  onComplete: (workOrder: WorkOrder) => void;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Non renseignée";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function formatCost(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(2)} DT`;
}

function formatDuration(value: number | null, emptyLabel = "Non renseignée"): string {
  if (value === null || Number.isNaN(value)) {
    return emptyLabel;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours <= 0) {
    return `${minutes} min`;
  }

  return `${hours} h ${String(minutes).padStart(2, "0")} min`;
}

function formatDurationGap(estimated: number | null, actual: number | null): string {
  if (estimated === null || actual === null) {
    return "-";
  }

  const gap = actual - estimated;
  const sign = gap > 0 ? "+" : "";
  return `${sign}${gap} min`;
}

export function WorkOrderDetailsDrawer({
  open,
  loading,
  workOrder,
  currentUserId,
  processingActionWorkOrderId,
  onClose,
  onAccept,
  onStart,
  onComplete,
}: WorkOrderDetailsDrawerProps) {
  if (!open) {
    return null;
  }

  const assignedToCurrentUser =
    workOrder?.assignedTechnicianId !== null &&
    workOrder?.assignedTechnicianId !== undefined &&
    currentUserId !== null &&
    String(workOrder.assignedTechnicianId) === String(currentUserId);
  const isProcessing = workOrder ? processingActionWorkOrderId === workOrder.id : false;

  return (
    <ResponsiveSidePanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer le detail de l'ordre de travail"
      title="Detail ordre de travail"
      description="Vue complete de suivi et d'execution."
      maxWidthClassName="md:max-w-xl"
    >
      {loading ? (
        <div className="text-sm text-muted-foreground">Chargement...</div>
      ) : workOrder ? (
        <div className="space-y-4">
          <Card className="border-border/90">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Identification</p>
              <p className="text-lg font-semibold text-foreground">{workOrder.reference}</p>
              <p className="text-sm text-foreground">{workOrder.description}</p>
              <div className="flex flex-wrap gap-2">
                <WorkOrderTypeBadge type={workOrder.type} />
                <WorkOrderPriorityBadge priority={workOrder.priority} />
                <WorkOrderStatusBadge status={workOrder.status} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/90">
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Traçabilité de l'intervention
                </p>
                <WorkOrderActionButton
                  workOrder={workOrder}
                  assignedToCurrentUser={assignedToCurrentUser}
                  isProcessing={isProcessing}
                  onAccept={onAccept}
                  onStart={onStart}
                  onComplete={onComplete}
                />
              </div>
              <WorkOrderStatusTimeline status={workOrder.status} />
              <div className="grid gap-2 sm:grid-cols-2">
                <InfoLine
                  icon={UserRound}
                  label="Technicien responsable"
                  value={workOrder.assignedTechnicianName ?? "Non renseigné"}
                />
                <InfoLine icon={CalendarClock} label="Date d'affectation" value={formatDateTime(workOrder.assignedAt)} />
                <InfoLine icon={Hand} label="Pris en charge le" value={formatDateTime(workOrder.acceptedAt)} />
                <InfoLine
                  icon={Play}
                  label="Intervention démarrée le"
                  value={formatDateTime(workOrder.startedAt)}
                />
                <InfoLine
                  icon={CheckCircle2}
                  label="Intervention terminée le"
                  value={formatDateTime(workOrder.completedAt)}
                />
                <InfoLine
                  icon={Timer}
                  label="Durée estimée"
                  value={formatDuration(workOrder.estimatedDurationMinutes)}
                />
                <InfoLine
                  icon={Timer}
                  label="Durée réelle"
                  value={
                    workOrder.status === "COMPLETED"
                      ? formatDuration(workOrder.actualDurationMinutes, "Non calculée")
                      : "En cours de calcul"
                  }
                />
                <InfoLine
                  icon={Timer}
                  label="Écart estimé / réel"
                  value={formatDurationGap(workOrder.estimatedDurationMinutes, workOrder.actualDurationMinutes)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/90">
            <CardContent className="space-y-3 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Informations liees</p>
              <InfoLine icon={Gauge} label="Equipement" value={`${workOrder.equipmentCode} - ${workOrder.equipmentName}`} />
              <InfoLine icon={FileCog} label="Panne associee" value={workOrder.breakdownReference ?? "-"} />
            </CardContent>
          </Card>

          <Card className="border-border/90">
            <CardContent className="space-y-3 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Dates et couts</p>
              <InfoLine icon={CalendarClock} label="Creation" value={formatDateTime(workOrder.createdAt)} />
              <InfoLine icon={CalendarClock} label="Planifiee" value={formatDateTime(workOrder.plannedDate)} />
              <InfoLine icon={ReceiptText} label="Cout estime" value={formatCost(workOrder.estimatedCost)} />
              <InfoLine icon={ReceiptText} label="Cout reel" value={formatCost(workOrder.realCost)} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Aucune donnee disponible.</div>
      )}
    </ResponsiveSidePanel>
  );
}

function WorkOrderActionButton({
  workOrder,
  assignedToCurrentUser,
  isProcessing,
  onAccept,
  onStart,
  onComplete,
}: {
  workOrder: WorkOrder;
  assignedToCurrentUser: boolean;
  isProcessing: boolean;
  onAccept: (workOrder: WorkOrder) => void;
  onStart: (workOrder: WorkOrder) => void;
  onComplete: (workOrder: WorkOrder) => void;
}) {
  if (!assignedToCurrentUser) {
    return null;
  }

  if (workOrder.status === "ASSIGNED") {
    return (
      <Button
        type="button"
        size="sm"
        className="w-full sm:w-auto"
        disabled={isProcessing}
        onClick={() => onAccept(workOrder)}
        aria-label={`Prendre en charge l'ordre de travail ${workOrder.reference}`}
      >
        {isProcessing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Hand className="mr-2 h-4 w-4" />}
        Prendre en charge
      </Button>
    );
  }

  if (workOrder.status === "ACCEPTED") {
    return (
      <Button
        type="button"
        size="sm"
        className="w-full sm:w-auto"
        disabled={isProcessing}
        onClick={() => onStart(workOrder)}
        aria-label={`Demarrer l'intervention ${workOrder.reference}`}
      >
        {isProcessing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
        Demarrer l'intervention
      </Button>
    );
  }

  if (workOrder.status === "IN_PROGRESS") {
    return (
      <Button
        type="button"
        size="sm"
        className="w-full sm:w-auto"
        disabled={isProcessing}
        onClick={() => onComplete(workOrder)}
        aria-label={`Terminer l'intervention ${workOrder.reference}`}
      >
        {isProcessing ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        Terminer l'intervention
      </Button>
    );
  }

  return null;
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
