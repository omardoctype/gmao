export interface SparePart {
  id: number;
  reference: string;
  name: string;
  category: string;
  quantityInStock: number;
  minimumThreshold: number;
  unitPrice: number;
  minimumThresholdReached: boolean;
  stockAlert: string | null;
}

export interface SparePartPayload {
  reference: string;
  name: string;
  category: string;
  quantityInStock: number;
  minimumThreshold: number;
  unitPrice: number;
}

export type StockMovementType = "IN" | "OUT";

export interface StockMovement {
  id: number;
  type: StockMovementType;
  quantity: number;
  movementDate: string;
  sparePartId: number;
  sparePartReference: string;
  sparePartName: string;
  quantityInStockAfterMovement: number;
  minimumThresholdReached: boolean;
  stockAlert: string | null;
}

export interface StockMovementPayload {
  quantity: number;
}
