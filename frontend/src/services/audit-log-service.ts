import { apiGetData } from "@/services/api";
import type { PageQueryParams, PagedResponse } from "@/types/api";
import type { AuditLogItem } from "@/types/audit-log";

const AUDIT_LOGS_API_BASE = "/api/audit-logs";

export interface AuditLogListParams extends PageQueryParams {
  action?: string;
  entityType?: string;
  username?: string;
}

export function getAuditLogs(params?: AuditLogListParams): Promise<PagedResponse<AuditLogItem>> {
  return apiGetData<PagedResponse<AuditLogItem>>(AUDIT_LOGS_API_BASE, { params });
}
