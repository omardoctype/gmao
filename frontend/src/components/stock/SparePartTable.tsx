import { ArrowDownCircle, ArrowUpCircle, Pencil } from "lucide-react";
import { StockThresholdBadge } from "@/components/stock/StockBadges";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SparePart } from "@/types/stock";

interface SparePartTableProps {
  spareParts: SparePart[];
  canManage: boolean;
  processingMovementPartId: number | null;
  onEdit: (sparePart: SparePart) => void;
  onStockIn: (sparePart: SparePart) => void;
  onStockOut: (sparePart: SparePart) => void;
}

function formatPrice(value: number): string {
  return `${value.toFixed(2)} DT`;
}

function stockPercent(quantityInStock: number, minimumThreshold: number): number {
  if (minimumThreshold <= 0) {
    return 100;
  }

  return Math.max(0, Math.min(100, Math.round((quantityInStock / minimumThreshold) * 100)));
}

export function SparePartTable({
  spareParts,
  canManage,
  processingMovementPartId,
  onEdit,
  onStockIn,
  onStockOut,
}: SparePartTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Piece</TableHead>
          <TableHead>Categorie</TableHead>
          <TableHead>Stock actuel</TableHead>
          <TableHead>Seuil min.</TableHead>
          <TableHead>Etat</TableHead>
          <TableHead>Prix unitaire</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {spareParts.map((sparePart) => {
          const percent = stockPercent(sparePart.quantityInStock, sparePart.minimumThreshold);
          const isCritical = sparePart.quantityInStock <= sparePart.minimumThreshold;
          const isWarning =
            sparePart.quantityInStock > sparePart.minimumThreshold &&
            sparePart.quantityInStock <= sparePart.minimumThreshold * 1.5;
          const progressToneClass =
            isCritical
              ? "bg-destructive"
              : isWarning
                ? "bg-warning"
                : "bg-success";

          return (
            <TableRow
              key={sparePart.id}
              className={cn(
                isCritical && "bg-destructive/5 hover:bg-destructive/10",
                isWarning && "bg-warning/5 hover:bg-warning/10",
              )}
            >
              <TableCell className="font-semibold">{sparePart.reference}</TableCell>
              <TableCell>
                <p className="font-medium text-foreground">{sparePart.name}</p>
                {sparePart.stockAlert ? <p className="text-xs text-muted-foreground">{sparePart.stockAlert}</p> : null}
              </TableCell>
              <TableCell>{sparePart.category}</TableCell>
              <TableCell className="font-semibold">{sparePart.quantityInStock}</TableCell>
              <TableCell>{sparePart.minimumThreshold}</TableCell>
              <TableCell>
                <div className="space-y-2">
                  <StockThresholdBadge
                    quantityInStock={sparePart.quantityInStock}
                    minimumThreshold={sparePart.minimumThreshold}
                  />
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${progressToneClass}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </TableCell>
              <TableCell>{formatPrice(sparePart.unitPrice)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1.5">
                  {canManage ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onEdit(sparePart)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={processingMovementPartId === sparePart.id}
                        onClick={() => onStockIn(sparePart)}
                      >
                        <ArrowUpCircle className="h-4 w-4 text-success" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={processingMovementPartId === sparePart.id}
                        onClick={() => onStockOut(sparePart)}
                      >
                        <ArrowDownCircle className="h-4 w-4 text-warning" />
                      </Button>
                    </>
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
