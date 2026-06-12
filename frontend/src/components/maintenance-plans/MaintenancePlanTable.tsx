import { Pencil, Trash2 } from "lucide-react";
import {
  MaintenancePlanFrequencyBadge,
  MaintenancePlanTypeBadge,
} from "@/components/maintenance-plans/MaintenancePlanBadges";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MaintenancePlan } from "@/types/maintenance-plan";

interface MaintenancePlanTableProps {
  maintenancePlans: MaintenancePlan[];
  canManage: boolean;
  deletingMaintenancePlanId: number | null;
  onEdit: (maintenancePlan: MaintenancePlan) => void;
  onDelete: (maintenancePlan: MaintenancePlan) => void;
}

function formatDate(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("fr-FR", {
    dateStyle: "medium",
  });
}

function dueInLabel(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Date invalide";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(parsedDate);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `En retard de ${Math.abs(diffDays)} jour(s)`;
  }

  if (diffDays === 0) {
    return "Execution aujourd'hui";
  }

  return `Dans ${diffDays} jour(s)`;
}

export function MaintenancePlanTable({
  maintenancePlans,
  canManage,
  deletingMaintenancePlanId,
  onEdit,
  onDelete,
}: MaintenancePlanTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Frequence</TableHead>
          <TableHead>Prochaine execution</TableHead>
          <TableHead>Equipement</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {maintenancePlans.map((maintenancePlan) => (
          <TableRow key={maintenancePlan.id}>
            <TableCell>
              <MaintenancePlanTypeBadge type={maintenancePlan.type} />
            </TableCell>
            <TableCell>
              <MaintenancePlanFrequencyBadge frequency={maintenancePlan.frequency} />
            </TableCell>
            <TableCell>
              <p className="font-medium text-foreground">{formatDate(maintenancePlan.nextExecutionDate)}</p>
              <p className="text-xs text-muted-foreground">{dueInLabel(maintenancePlan.nextExecutionDate)}</p>
            </TableCell>
            <TableCell>
              <p className="text-sm font-medium text-foreground">{maintenancePlan.equipmentCode}</p>
              <p className="text-xs text-muted-foreground">{maintenancePlan.equipmentName}</p>
            </TableCell>
            <TableCell>
              <p className="line-clamp-2 max-w-sm text-sm text-muted-foreground">{maintenancePlan.description}</p>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                {canManage ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(maintenancePlan)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingMaintenancePlanId === maintenancePlan.id}
                      onClick={() => onDelete(maintenancePlan)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
