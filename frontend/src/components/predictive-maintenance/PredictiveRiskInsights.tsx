import {
  Activity,
  AlertTriangle,
  ClipboardList,
  FileText,
  Gauge,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictiveRiskLevelBadge } from "@/components/predictive-maintenance/PredictiveRiskBadges";
import { cn } from "@/lib/utils";
import type { PredictiveRiskLevel, PredictiveRiskReason } from "@/types/predictive-maintenance";

type ReasonGroupKey = "equipment" | "breakdowns" | "workOrders" | "preventive" | "reports" | "other";

interface DisplayReason {
  criterion: string;
  detail: string;
  points: number | null;
}

interface ReasonGroup {
  key: ReasonGroupKey;
  title: string;
  description: string;
  icon: typeof ShieldAlert;
  reasons: DisplayReason[];
}

interface PredictiveRiskScoreCardProps {
  riskScore: number;
  riskLevel: PredictiveRiskLevel;
  className?: string;
}

interface PredictiveRiskScoreMeterProps extends PredictiveRiskScoreCardProps {
  compact?: boolean;
}

interface PredictiveRecommendedActionCardProps {
  recommendedAction: string;
  className?: string;
}

interface PredictiveRiskReasonsPanelProps {
  reasons?: PredictiveRiskReason[];
  reasonMessages?: string[];
  className?: string;
}

const GROUP_META: Record<ReasonGroupKey, Omit<ReasonGroup, "reasons">> = {
  equipment: {
    key: "equipment",
    title: "Etat equipement",
    description: "Criticite et statut operationnel.",
    icon: ShieldAlert,
  },
  breakdowns: {
    key: "breakdowns",
    title: "Historique pannes",
    description: "Volume, gravite et recurrence des pannes.",
    icon: AlertTriangle,
  },
  workOrders: {
    key: "workOrders",
    title: "Ordres de travail",
    description: "OT ouverts ou en retard.",
    icon: ClipboardList,
  },
  preventive: {
    key: "preventive",
    title: "Maintenance preventive",
    description: "Controle du retard preventif ou inspection.",
    icon: Wrench,
  },
  reports: {
    key: "reports",
    title: "Rapports intervention",
    description: "Signaux issus des rapports techniciens.",
    icon: FileText,
  },
  other: {
    key: "other",
    title: "Autres facteurs",
    description: "Autres signaux explicatifs du score.",
    icon: Activity,
  },
};

const GROUP_ORDER: ReasonGroupKey[] = ["equipment", "breakdowns", "workOrders", "preventive", "reports", "other"];

function scoreToneClass(riskLevel: PredictiveRiskLevel): string {
  if (riskLevel === "LOW") {
    return "bg-success";
  }
  if (riskLevel === "MEDIUM") {
    return "bg-primary/75";
  }
  if (riskLevel === "HIGH") {
    return "bg-warning";
  }
  return "bg-destructive";
}

function scoreTextClass(riskLevel: PredictiveRiskLevel): string {
  if (riskLevel === "LOW") {
    return "text-success";
  }
  if (riskLevel === "MEDIUM") {
    return "text-primary";
  }
  if (riskLevel === "HIGH") {
    return "text-warning";
  }
  return "text-destructive";
}

function safeProgressValue(value: number): number {
  if (value <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(4, value));
}

function groupKeyFromCriterion(criterion: string): ReasonGroupKey {
  if (criterion === "CRITICALITY" || criterion === "STATUS") {
    return "equipment";
  }
  if (
    criterion === "BREAKDOWNS_LAST_90_DAYS" ||
    criterion === "BREAKDOWN_SEVERITY" ||
    criterion === "REPEATED_BREAKDOWN_TYPE"
  ) {
    return "breakdowns";
  }
  if (criterion === "OPEN_WORK_ORDERS" || criterion === "OVERDUE_WORK_ORDERS") {
    return "workOrders";
  }
  if (criterion === "PREVENTIVE_MAINTENANCE_OVERDUE") {
    return "preventive";
  }
  if (criterion.startsWith("INTERVENTION_REPORT")) {
    return "reports";
  }
  return "other";
}

function groupKeyFromText(value: string): ReasonGroupKey {
  const normalized = value.toLowerCase();
  if (normalized.includes("rapport") || normalized.includes("intervention") || normalized.includes("surveillance")) {
    return "reports";
  }
  if (normalized.includes("panne") || normalized.includes("repetition") || normalized.includes("critique recente")) {
    return "breakdowns";
  }
  if (normalized.includes("ordre") || normalized.includes("ot ") || normalized.includes("travail")) {
    return "workOrders";
  }
  if (normalized.includes("preventive") || normalized.includes("inspection")) {
    return "preventive";
  }
  if (normalized.includes("criticite") || normalized.includes("hors service") || normalized.includes("maintenance")) {
    return "equipment";
  }
  return "other";
}

function parseReasonMessage(message: string): DisplayReason {
  const pointsMatch = message.match(/\(\+(\d+)\s*pts?\)/i);
  const points = pointsMatch ? Number(pointsMatch[1]) : null;
  const detail = message.replace(/\s*\(\+\d+\s*pts?\)\s*$/i, "").trim();
  return {
    criterion: groupKeyFromText(message).toUpperCase(),
    detail,
    points,
  };
}

function buildReasonGroups(reasons: DisplayReason[]): ReasonGroup[] {
  const groups = new Map<ReasonGroupKey, DisplayReason[]>();
  for (const reason of reasons) {
    const groupKey = reason.criterion === groupKeyFromText(reason.detail).toUpperCase()
      ? groupKeyFromText(reason.detail)
      : groupKeyFromCriterion(reason.criterion);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), reason]);
  }

  return GROUP_ORDER
    .map((groupKey) => ({
      ...GROUP_META[groupKey],
      reasons: groups.get(groupKey) ?? [],
    }))
    .filter((group) => group.reasons.length > 0);
}

export function PredictiveRiskScoreMeter({
  riskScore,
  riskLevel,
  className,
  compact = false,
}: PredictiveRiskScoreMeterProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className={cn(compact ? "text-xl" : "text-3xl", "font-semibold leading-none", scoreTextClass(riskLevel))}>
            {riskScore}
          </span>
          <span className="text-sm font-medium text-muted-foreground">/100</span>
        </div>
        <PredictiveRiskLevelBadge riskLevel={riskLevel} />
      </div>
      <div className={cn(compact ? "h-2" : "h-3", "overflow-hidden rounded-full bg-muted")}>
        <div
          className={cn("h-full rounded-full transition-all", scoreToneClass(riskLevel))}
          style={{ width: `${safeProgressValue(riskScore)}%` }}
        />
      </div>
    </div>
  );
}

export function PredictiveRiskScoreCard({
  riskScore,
  riskLevel,
  className,
}: PredictiveRiskScoreCardProps) {
  return (
    <Card className={cn("border-border/90 bg-surface", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4 text-primary" />
          Score predictif
        </CardTitle>
        <CardDescription>Lecture rapide du niveau de priorite maintenance.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <PredictiveRiskScoreMeter riskScore={riskScore} riskLevel={riskLevel} />
      </CardContent>
    </Card>
  );
}

export function PredictiveRecommendedActionCard({
  recommendedAction,
  className,
}: PredictiveRecommendedActionCardProps) {
  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="h-4 w-4 text-primary" />
          Action recommandee
        </CardTitle>
        <CardDescription>Decision lisible pour prioriser la prochaine action.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm leading-relaxed text-foreground">{recommendedAction}</p>
      </CardContent>
    </Card>
  );
}

export function PredictiveRiskReasonsPanel({
  reasons,
  reasonMessages,
  className,
}: PredictiveRiskReasonsPanelProps) {
  const displayReasons: DisplayReason[] = reasons?.length
    ? reasons.map((reason) => ({
        criterion: reason.criterion,
        detail: reason.detail,
        points: reason.points,
      }))
    : (reasonMessages ?? []).map(parseReasonMessage);

  const groups = buildReasonGroups(displayReasons);

  return (
    <Card className={cn("border-border/90 bg-surface", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-primary" />
          Raisons du score
        </CardTitle>
        <CardDescription>Facteurs explicatifs regroupes par famille maintenance.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {groups.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {groups.map((group) => {
              const Icon = group.icon;
              const totalPoints = group.reasons.reduce((sum, reason) => sum + Math.max(0, reason.points ?? 0), 0);

              return (
                <article
                  key={group.key}
                  className="rounded-xl border border-border/80 bg-surface-elevated p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{group.description}</p>
                      </div>
                    </div>
                    <Badge variant={totalPoints > 0 ? "outline" : "secondary"} className="w-fit shrink-0">
                      +{totalPoints} pts
                    </Badge>
                  </div>

                  <ul className="mt-3 space-y-2">
                    {group.reasons.map((reason, index) => (
                      <li
                        key={`${group.key}-${reason.criterion}-${index}`}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                        <span className="leading-relaxed">
                          {reason.detail}
                          {reason.points !== null ? (
                            <span className="ml-1 whitespace-nowrap text-xs font-semibold text-muted-foreground">
                              (+{reason.points} pts)
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune raison detaillee retournee pour cet equipement.</p>
        )}
      </CardContent>
    </Card>
  );
}
