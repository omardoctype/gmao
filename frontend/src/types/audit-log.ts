export interface AuditLogItem {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  userId: number | null;
  username: string | null;
  details: string | null;
  createdAt: string;
}
