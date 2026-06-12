import { Badge } from "@/components/ui/badge";
import type { StockMovementType } from "@/types/stock";

export function StockMovementTypeBadge({ type }: { type: StockMovementType }) {
  if (type === "IN") {
    return <Badge variant="success">Entree</Badge>;
  }

  return <Badge variant="warning">Sortie</Badge>;
}

export function StockThresholdBadge({
  quantityInStock,
  minimumThreshold,
}: {
  quantityInStock: number;
  minimumThreshold: number;
}) {
  if (quantityInStock <= minimumThreshold) {
    return <Badge variant="destructive">Seuil critique</Badge>;
  }

  if (quantityInStock <= minimumThreshold * 1.5) {
    return <Badge variant="warning">Stock a surveiller</Badge>;
  }

  return <Badge variant="success">Stock normal</Badge>;
}

export function StockMovementAlertBadge({ minimumThresholdReached }: { minimumThresholdReached: boolean }) {
  if (minimumThresholdReached) {
    return <Badge variant="destructive">Seuil critique</Badge>;
  }

  return <Badge variant="success">Stock stable</Badge>;
}
