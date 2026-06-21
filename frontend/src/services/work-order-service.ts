import { apiGetData, apiPatchData, apiPostData, apiPutData } from "@/services/api";
import type { PageQueryParams, PagedResponse } from "@/types/api";
import type { InterventionReport, InterventionReportPayload, WorkOrder, WorkOrderPayload } from "@/types/work-order";

const WORK_ORDERS_API_BASE = "/api/work-orders";

export interface WorkOrderListParams extends PageQueryParams {
  search?: string;
  status?: WorkOrder["status"];
  priority?: WorkOrder["priority"];
  type?: WorkOrder["type"];
}

export function getWorkOrders(params?: WorkOrderListParams): Promise<PagedResponse<WorkOrder>> {
  return apiGetData<PagedResponse<WorkOrder>>(WORK_ORDERS_API_BASE, { params });
}

export function getWorkOrderById(id: number): Promise<WorkOrder> {
  return apiGetData<WorkOrder>(`${WORK_ORDERS_API_BASE}/${id}`);
}

export function getWorkOrderInterventionReport(id: number): Promise<InterventionReport> {
  return apiGetData<InterventionReport>(`${WORK_ORDERS_API_BASE}/${id}/report`);
}

export function createWorkOrder(payload: WorkOrderPayload): Promise<WorkOrder> {
  return apiPostData<WorkOrder, WorkOrderPayload>(WORK_ORDERS_API_BASE, payload);
}

export function updateWorkOrder(id: number, payload: WorkOrderPayload): Promise<WorkOrder> {
  return apiPutData<WorkOrder, WorkOrderPayload>(`${WORK_ORDERS_API_BASE}/${id}`, payload);
}

export function assignWorkOrderTechnician(id: number, technicianId: number): Promise<WorkOrder> {
  return apiPatchData<WorkOrder>(`${WORK_ORDERS_API_BASE}/${id}/assign/${technicianId}`);
}

export function acceptWorkOrder(id: number): Promise<WorkOrder> {
  return apiPostData<WorkOrder>(`${WORK_ORDERS_API_BASE}/${id}/accept`);
}

export function startWorkOrder(id: number): Promise<WorkOrder> {
  return apiPostData<WorkOrder>(`${WORK_ORDERS_API_BASE}/${id}/start`);
}

export function closeWorkOrder(id: number): Promise<WorkOrder> {
  return apiPatchData<WorkOrder>(`${WORK_ORDERS_API_BASE}/${id}/close`);
}

export function closeWorkOrderWithReport(
  id: number,
  payload: InterventionReportPayload,
): Promise<InterventionReport> {
  return apiPostData<InterventionReport, InterventionReportPayload>(
    `${WORK_ORDERS_API_BASE}/${id}/complete`,
    payload,
  );
}
