import { Badge } from "@/components/ui/badge";
import type { DashboardTrend } from "@/types/dashboard";

interface DashboardStatusPillProps {
  label: string;
  tone: DashboardTrend;
}

export function DashboardStatusPill({ label, tone }: DashboardStatusPillProps) {
  if (tone === "up") {
    return <Badge variant="success">{label}</Badge>;
  }

  if (tone === "down") {
    return <Badge variant="destructive">{label}</Badge>;
  }

  return <Badge variant="secondary">{label}</Badge>;
}
