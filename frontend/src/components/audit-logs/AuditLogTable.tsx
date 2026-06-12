import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AuditLogItem } from "@/types/audit-log";

interface AuditLogTableProps {
  logs: AuditLogItem[];
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

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Entity Type</TableHead>
          <TableHead>Entity ID</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Details</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="font-semibold">{log.action}</TableCell>
            <TableCell>{log.entityType}</TableCell>
            <TableCell>{log.entityId ?? "-"}</TableCell>
            <TableCell>{log.username ?? "-"}</TableCell>
            <TableCell>
              <p className="line-clamp-2 max-w-[420px] text-sm text-muted-foreground">{log.details ?? "-"}</p>
            </TableCell>
            <TableCell>{formatDateTime(log.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
