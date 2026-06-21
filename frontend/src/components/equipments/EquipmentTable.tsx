import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Equipment } from "@/types/equipment";

interface EquipmentTableProps {
  equipments: Equipment[];
  canManage: boolean;
  deletingEquipmentId: number | null;
  onView: (equipment: Equipment) => void;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
}

function statusLabel(status: Equipment["status"]): string {
  if (status === "OPERATIONAL") {
    return "Operationnel";
  }

  if (status === "MAINTENANCE") {
    return "Maintenance";
  }

  return "Hors service";
}

function statusToneClass(status: Equipment["status"]): string {
  if (status === "OPERATIONAL") {
    return "bg-success/15 text-success";
  }

  if (status === "MAINTENANCE") {
    return "bg-warning/15 text-warning";
  }

  return "bg-destructive/15 text-destructive";
}

function criticalityLabel(criticality: Equipment["criticality"]): string {
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

function criticalityToneClass(criticality: Equipment["criticality"]): string {
  if (criticality === "LOW") {
    return "bg-secondary text-secondary-foreground";
  }

  if (criticality === "MEDIUM") {
    return "bg-accent/15 text-accent";
  }

  if (criticality === "HIGH") {
    return "bg-warning/15 text-warning";
  }

  return "bg-destructive/15 text-destructive";
}

export function EquipmentTable({
  equipments,
  canManage,
  deletingEquipmentId,
  onView,
  onEdit,
  onDelete,
}: EquipmentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead>Categorie</TableHead>
          <TableHead>Localisation</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Criticite</TableHead>
          <TableHead className="sticky right-0 bg-secondary/95 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {equipments.map((equipment) => (
          <TableRow key={equipment.id}>
            <TableCell className="font-semibold">{equipment.code}</TableCell>
            <TableCell className="sticky right-0 bg-surface/95">
              <p className="font-medium text-foreground">{equipment.name}</p>
              <p className="text-xs text-muted-foreground">{equipment.brand || "Marque non renseignee"}</p>
            </TableCell>
            <TableCell>{equipment.category}</TableCell>
            <TableCell>{equipment.location || "-"}</TableCell>
            <TableCell>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusToneClass(equipment.status)}`}>
                {statusLabel(equipment.status)}
              </span>
            </TableCell>
            <TableCell>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${criticalityToneClass(equipment.criticality)}`}>
                {criticalityLabel(equipment.criticality)}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(equipment)}
                  aria-label={`Voir les details de l'equipement ${equipment.code}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {canManage ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(equipment)}
                      aria-label={`Modifier l'equipement ${equipment.code}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={deletingEquipmentId === equipment.id}
                      onClick={() => onDelete(equipment)}
                      aria-label={`Supprimer l'equipement ${equipment.code}`}
                    >
                      <Trash2 className="h-4 w-4" />
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
