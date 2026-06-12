import { apiGetData, apiPatchData, apiPostData, apiPutData } from "@/services/api";
import type { PageQueryParams, PagedResponse } from "@/types/api";
import type { Breakdown, BreakdownPayload, BreakdownStatusPayload } from "@/types/breakdown";

const BREAKDOWNS_API_BASE = "/api/breakdowns";

export interface BreakdownListParams extends PageQueryParams {
  search?: string;
  status?: Breakdown["status"];
  priority?: Breakdown["priority"];
  type?: Breakdown["type"];
}

export function getBreakdowns(params?: BreakdownListParams): Promise<PagedResponse<Breakdown>> {
  return apiGetData<PagedResponse<Breakdown>>(BREAKDOWNS_API_BASE, { params });
}

export async function getBreakdownOptions(size = 200): Promise<Breakdown[]> {
  const response = await getBreakdowns({ page: 0, size, sort: "declaredAt,desc" });
  return response.content;
}

export function getBreakdownById(id: number): Promise<Breakdown> {
  return apiGetData<Breakdown>(`${BREAKDOWNS_API_BASE}/${id}`);
}

export function createBreakdown(payload: BreakdownPayload): Promise<Breakdown> {
  return apiPostData<Breakdown, BreakdownPayload>(BREAKDOWNS_API_BASE, payload);
}

export function updateBreakdown(id: number, payload: BreakdownPayload): Promise<Breakdown> {
  return apiPutData<Breakdown, BreakdownPayload>(`${BREAKDOWNS_API_BASE}/${id}`, payload);
}

export function updateBreakdownStatus(id: number, payload: BreakdownStatusPayload): Promise<Breakdown> {
  return apiPatchData<Breakdown, BreakdownStatusPayload>(`${BREAKDOWNS_API_BASE}/${id}/status`, payload);
}
