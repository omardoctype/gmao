import { StockMovementAlertBadge, StockMovementTypeBadge } from "@/components/stock/StockBadges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockMovement } from "@/types/stock";

interface StockMovementHistoryTableProps {
  movements: StockMovement[];
}

function formatDateTime(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function StockMovementHistoryTable({ movements }: StockMovementHistoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Piece</TableHead>
          <TableHead>Quantite</TableHead>
          <TableHead>Stock apres mouvement</TableHead>
          <TableHead>Etat stock</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => (
          <TableRow key={movement.id}>
            <TableCell>{formatDateTime(movement.movementDate)}</TableCell>
            <TableCell>
              <StockMovementTypeBadge type={movement.type} />
            </TableCell>
            <TableCell>
              <p className="text-sm font-medium text-foreground">{movement.sparePartReference}</p>
              <p className="text-xs text-muted-foreground">{movement.sparePartName}</p>
            </TableCell>
            <TableCell className="font-semibold">{movement.quantity}</TableCell>
            <TableCell>{movement.quantityInStockAfterMovement}</TableCell>
            <TableCell>
              <StockMovementAlertBadge minimumThresholdReached={movement.minimumThresholdReached} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
