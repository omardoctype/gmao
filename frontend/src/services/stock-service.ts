import { apiGetData, apiPostData, apiPutData } from "@/services/api";
import type { PageQueryParams, PagedResponse } from "@/types/api";
import type { SparePart, SparePartPayload, StockMovement, StockMovementPayload } from "@/types/stock";

const SPARE_PARTS_API_BASE = "/api/spare-parts";
const STOCK_MOVEMENTS_API_BASE = "/api/stock-movements";

export interface SparePartListParams extends PageQueryParams {
  search?: string;
  category?: string;
  minimumThreshold?: number;
}

export function getSpareParts(params?: SparePartListParams): Promise<PagedResponse<SparePart>> {
  return apiGetData<PagedResponse<SparePart>>(SPARE_PARTS_API_BASE, { params });
}

export function getSparePartById(id: number): Promise<SparePart> {
  return apiGetData<SparePart>(`${SPARE_PARTS_API_BASE}/${id}`);
}

export function createSparePart(payload: SparePartPayload): Promise<SparePart> {
  return apiPostData<SparePart, SparePartPayload>(SPARE_PARTS_API_BASE, payload);
}

export function updateSparePart(id: number, payload: SparePartPayload): Promise<SparePart> {
  return apiPutData<SparePart, SparePartPayload>(`${SPARE_PARTS_API_BASE}/${id}`, payload);
}

export function stockInSparePart(id: number, payload: StockMovementPayload): Promise<StockMovement> {
  return apiPostData<StockMovement, StockMovementPayload>(`${SPARE_PARTS_API_BASE}/${id}/stock-in`, payload);
}

export function stockOutSparePart(id: number, payload: StockMovementPayload): Promise<StockMovement> {
  return apiPostData<StockMovement, StockMovementPayload>(`${SPARE_PARTS_API_BASE}/${id}/stock-out`, payload);
}

export function getStockMovements(): Promise<StockMovement[]> {
  return apiGetData<StockMovement[]>(STOCK_MOVEMENTS_API_BASE);
}
