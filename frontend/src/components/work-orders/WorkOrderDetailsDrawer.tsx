import { CalendarClock, FileCog, Gauge, ReceiptText, UserRound } from "lucide-react";
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
  onClose: () => void;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
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

export function WorkOrderDetailsDrawer({ open, loading, workOrder, onClose }: WorkOrderDetailsDrawerProps) {
  if (!open) {
    return null;
  }

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
                  <CardContent className="space-y-3 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Timeline d'avancement</p>
                    <WorkOrderStatusTimeline status={workOrder.status} />
                  </CardContent>
                </Card>

                <Card className="border-border/90">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Informations liees</p>
                    <InfoLine icon={Gauge} label="Equipement" value={`${workOrder.equipmentCode} - ${workOrder.equipmentName}`} />
                    <InfoLine icon={FileCog} label="Panne associee" value={workOrder.breakdownReference ?? "-"} />
                    <InfoLine icon={UserRound} label="Technicien affecte" value={workOrder.assignedTechnicianName ?? "-"} />
                  </CardContent>
                </Card>

                <Card className="border-border/90">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Dates et couts</p>
                    <InfoLine icon={CalendarClock} label="Creation" value={formatDateTime(workOrder.createdAt)} />
                    <InfoLine icon={CalendarClock} label="Planifiee" value={formatDateTime(workOrder.plannedDate)} />
                    <InfoLine icon={CalendarClock} label="Debut" value={formatDateTime(workOrder.startedAt)} />
                    <InfoLine icon={CalendarClock} label="Cloture" value={formatDateTime(workOrder.completedAt)} />
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
