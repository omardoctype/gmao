import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardTrend } from "@/types/dashboard";

interface DashboardKpiCardProps {
  label: string;
  value: string;
  helper: string;
  delta: string;
  trend: DashboardTrend;
  icon: LucideIcon;
}

function TrendBadge({ trend, delta }: { trend: DashboardTrend; delta: string }) {
  if (trend === "up") {
    return (
      <Badge variant="success" className="gap-1">
        <ArrowUpRight className="h-3.5 w-3.5" />
        {delta}
      </Badge>
    );
  }

  if (trend === "down") {
    return (
      <Badge variant="outline" className="gap-1 border-destructive/35 bg-destructive/10 text-destructive">
        <ArrowDownRight className="h-3.5 w-3.5" />
        {delta}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <ArrowRight className="h-3.5 w-3.5" />
      {delta}
    </Badge>
  );
}

export function DashboardKpiCard({ label, value, helper, delta, trend, icon: Icon }: DashboardKpiCardProps) {
  return (
    <Card className="border-border/90 bg-surface">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardDescription className="text-xs uppercase tracking-wide">{label}</CardDescription>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-elevated">
            <Icon className="h-4 w-4 text-primary" />
          </span>
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <TrendBadge trend={trend} delta={delta} />
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
