import { Brain, Eye, Pencil, RotateCcw } from "lucide-react";
import { BreakdownPriorityBadge, BreakdownStatusBadge, BreakdownTypeBadge } from "@/components/breakdowns/BreakdownBadges";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Breakdown } from "@/types/breakdown";

interface BreakdownTableProps {
  breakdowns: Breakdown[];
  canManage: boolean;
  canAiDiagnosis: boolean;
  updatingStatusBreakdownId: number | null;
  onView: (breakdown: Breakdown) => void;
  onEdit: (breakdown: Breakdown) => void;
  onAiDiagnosis: (breakdown: Breakdown) => void;
  onStatusChange: (breakdown: Breakdown) => void;
}

function formatDeclaredAt(declaredAt: string): string {
  const parsedDate = new Date(declaredAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return declaredAt;
  }

  return parsedDate.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function BreakdownTable({
  breakdowns,
  canManage,
  canAiDiagnosis,
  updatingStatusBreakdownId,
  onView,
  onEdit,
  onAiDiagnosis,
  onStatusChange,
}: BreakdownTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Panne</TableHead>
          <TableHead>Equipement</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Priorite</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Declaree le</TableHead>
          <TableHead className="sticky right-0 bg-secondary/95 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {breakdowns.map((breakdown) => (
          <TableRow key={breakdown.id}>
            <TableCell className="font-semibold">{breakdown.reference}</TableCell>
            <TableCell className="sticky right-0 bg-surface/95">
              <p className="font-medium text-foreground">{breakdown.title}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{breakdown.description}</p>
            </TableCell>
            <TableCell>
              <p className="text-sm text-foreground">{breakdown.equipmentCode}</p>
              <p className="text-xs text-muted-foreground">{breakdown.equipmentName}</p>
            </TableCell>
            <TableCell>
              <BreakdownTypeBadge type={breakdown.type} />
            </TableCell>
            <TableCell>
              <BreakdownPriorityBadge priority={breakdown.priority} />
            </TableCell>
            <TableCell>
              <BreakdownStatusBadge status={breakdown.status} />
            </TableCell>
            <TableCell>{formatDeclaredAt(breakdown.declaredAt)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(breakdown)}
                  aria-label={`Voir les details de la panne ${breakdown.reference}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {canAiDiagnosis ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Diagnostic IA"
                    aria-label={`Diagnostic IA pour la panne ${breakdown.reference}`}
                    onClick={() => onAiDiagnosis(breakdown)}
                  >
                    <Brain className="h-4 w-4" />
                  </Button>
                ) : null}
                {canManage ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(breakdown)}
                      aria-label={`Modifier la panne ${breakdown.reference}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updatingStatusBreakdownId === breakdown.id}
                      onClick={() => onStatusChange(breakdown)}
                      aria-label={`Changer le statut de la panne ${breakdown.reference}`}
                    >
                      <RotateCcw className="h-4 w-4" />
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
