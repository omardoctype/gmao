import { Brain, CalendarClock, FileWarning, Gauge } from "lucide-react";
import {
  BreakdownPriorityBadge,
  BreakdownStatusBadge,
  BreakdownTypeBadge,
} from "@/components/breakdowns/BreakdownBadges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveSidePanel } from "@/components/ui/overlay";
import type { Breakdown } from "@/types/breakdown";

interface BreakdownDetailsDrawerProps {
  open: boolean;
  loading: boolean;
  breakdown: Breakdown | null;
  canAiDiagnosis?: boolean;
  onAiDiagnosis?: (breakdown: Breakdown) => void;
  onClose: () => void;
}

function formatDeclaredAt(declaredAt: string): string {
  const parsedDate = new Date(declaredAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return declaredAt;
  }

  return parsedDate.toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export function BreakdownDetailsDrawer({
  open,
  loading,
  breakdown,
  canAiDiagnosis = false,
  onAiDiagnosis,
  onClose,
}: BreakdownDetailsDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <ResponsiveSidePanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer le detail de la panne"
      title="Detail panne"
      description="Visualisation complete pour qualification et suivi."
      maxWidthClassName="md:max-w-lg"
    >
      {loading ? (
        <div className="text-sm text-muted-foreground">Chargement...</div>
      ) : breakdown ? (
        <div className="space-y-4">
                <Card className="border-border/90">
                  <CardContent className="space-y-2 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Identification</p>
                    <p className="text-lg font-semibold text-foreground">{breakdown.reference}</p>
                    <p className="text-sm text-foreground">{breakdown.title}</p>
                    <p className="text-sm text-muted-foreground">{breakdown.description}</p>
                  </CardContent>
                </Card>

                <Card className="border-border/90">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Qualification</p>
                    <div className="flex flex-wrap gap-2">
                      <BreakdownTypeBadge type={breakdown.type} />
                      <BreakdownPriorityBadge priority={breakdown.priority} />
                      <BreakdownStatusBadge status={breakdown.status} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/90">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Contexte equipement</p>
                    <InfoLine icon={Gauge} label="Equipement" value={`${breakdown.equipmentCode} - ${breakdown.equipmentName}`} />
                    <InfoLine icon={CalendarClock} label="Declaree le" value={formatDeclaredAt(breakdown.declaredAt)} />
                    <InfoLine icon={FileWarning} label="ID panne" value={String(breakdown.id)} />
                  </CardContent>
                </Card>

                {canAiDiagnosis ? (
                  <Card className="border-border/90">
                    <CardContent className="space-y-3 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Assistance IA</p>
                      <p className="text-sm text-muted-foreground">
                        Genere un diagnostic IA avec des actions recommandees basees sur les documents de maintenance.
                      </p>
                      <Button type="button" className="w-full sm:w-auto" onClick={() => onAiDiagnosis?.(breakdown)}>
                        <Brain className="mr-2 h-4 w-4" />
                        Diagnostic IA
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Aucune donnee disponible.</div>
      )}
    </ResponsiveSidePanel>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
