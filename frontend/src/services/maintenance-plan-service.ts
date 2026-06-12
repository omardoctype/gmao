import { apiDeleteData, apiGetData, apiPostData, apiPutData } from "@/services/api";
import type { PageQueryParams, PagedResponse } from "@/types/api";
import type { MaintenancePlan, MaintenancePlanPayload } from "@/types/maintenance-plan";

const MAINTENANCE_PLANS_API_BASE = "/api/maintenance-plans";

export interface MaintenancePlanListParams extends PageQueryParams {
  type?: MaintenancePlan["type"];
  frequency?: MaintenancePlan["frequency"];
}

export function getMaintenancePlans(params?: MaintenancePlanListParams): Promise<PagedResponse<MaintenancePlan>> {
  return apiGetData<PagedResponse<MaintenancePlan>>(MAINTENANCE_PLANS_API_BASE, { params });
}

export function getMaintenancePlanById(id: number): Promise<MaintenancePlan> {
  return apiGetData<MaintenancePlan>(`${MAINTENANCE_PLANS_API_BASE}/${id}`);
}

export function createMaintenancePlan(payload: MaintenancePlanPayload): Promise<MaintenancePlan> {
  return apiPostData<MaintenancePlan, MaintenancePlanPayload>(MAINTENANCE_PLANS_API_BASE, payload);
}

export function updateMaintenancePlan(id: number, payload: MaintenancePlanPayload): Promise<MaintenancePlan> {
  return apiPutData<MaintenancePlan, MaintenancePlanPayload>(`${MAINTENANCE_PLANS_API_BASE}/${id}`, payload);
}

export function deleteMaintenancePlan(id: number): Promise<null> {
  return apiDeleteData<null>(`${MAINTENANCE_PLANS_API_BASE}/${id}`);
}
