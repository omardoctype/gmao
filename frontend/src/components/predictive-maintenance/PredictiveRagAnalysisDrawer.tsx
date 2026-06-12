import { AlertTriangle, Bot, LoaderCircle } from "lucide-react";
import { AiSourcesCards, AiStructuredAnswer } from "@/components/ai-assistant";
import {
  PredictiveRecommendedActionCard,
  PredictiveRiskReasonsPanel,
  PredictiveRiskScoreCard,
} from "@/components/predictive-maintenance/PredictiveRiskInsights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveCrudPanel } from "@/components/ui/responsive-crud-panel";
import type { PredictiveRagAnalysisResponse, PredictiveRiskEquipment } from "@/types/predictive-maintenance";

interface PredictiveRagAnalysisDrawerProps {
  open: boolean;
  loading: boolean;
  equipment: PredictiveRiskEquipment | null;
  analysis: PredictiveRagAnalysisResponse | null;
  error: string | null;
  canRetry: boolean;
  onClose: () => void;
  onRetry: () => void;
}

function buildFallbackReasons(equipment: PredictiveRiskEquipment | null): string[] {
  if (!equipment) {
    return [];
  }

  if (equipment.reasons.length === 0) {
    return ["Aucune raison detaillee n'a ete retournee pour cet equipement."];
  }

  return equipment.reasons.map((reason) => `${reason.criterion}: ${reason.detail} (+${reason.points} pts)`);
}

export function PredictiveRagAnalysisDrawer({
  open,
  loading,
  equipment,
  analysis,
  error,
  canRetry,
  onClose,
  onRetry,
}: PredictiveRagAnalysisDrawerProps) {
  if (!open || !equipment) {
    return null;
  }

  const riskScore = analysis?.riskScore ?? equipment.riskScore;
  const riskLevel = analysis?.riskLevel ?? equipment.riskLevel;
  const riskReasons = analysis?.riskReasons.length ? analysis.riskReasons : buildFallbackReasons(equipment);
  const predictiveRecommendation = analysis?.predictiveRecommendedAction ?? equipment.recommendedAction;

  return (
    <ResponsiveCrudPanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer l'analyse IA predictive"
      title={`Analyse IA predictive - ${equipment.equipmentCode}`}
      description={equipment.equipmentName}
      maxWidthClassName="md:max-w-5xl lg:max-w-6xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Fermer
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={onRetry} disabled={!canRetry || loading}>
            {loading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Analyse IA en cours...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                Relancer l'analyse IA
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Card className="border-border/90 bg-surface">
          <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Code</p>
              <p className="text-sm font-semibold text-foreground">{equipment.equipmentCode}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Categorie</p>
              <p className="text-sm text-foreground">{equipment.category}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Localisation</p>
              <p className="text-sm text-foreground">{equipment.location || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Criticite</p>
              <p className="text-sm text-foreground">{equipment.criticality}</p>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card className="border-border/90 bg-surface">
            <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
              Analyse IA en cours, cela peut prendre quelques secondes...
            </CardContent>
          </Card>
        ) : null}

        {!loading && error ? (
          <Card className="border-destructive/30 bg-destructive/10">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              {canRetry ? (
                <Button type="button" variant="outline" onClick={onRetry} className="w-full sm:w-auto">
                  Reessayer l'analyse IA
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {!loading && analysis ? (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <PredictiveRiskScoreCard riskScore={riskScore} riskLevel={riskLevel} />
              <PredictiveRecommendedActionCard recommendedAction={predictiveRecommendation} />
            </div>

            <PredictiveRiskReasonsPanel
              reasons={analysis ? undefined : equipment.reasons}
              reasonMessages={analysis ? riskReasons : undefined}
            />

            <Card className="border-border/90 bg-surface">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4 text-primary" />
                  Analyse IA documentaire
                </CardTitle>
                <CardDescription>
                  Synthese RAG basee sur les documents techniques et l'etat de risque de l'equipement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <AiStructuredAnswer answer={analysis.ragAnalysis} sources={analysis.sources} />
              </CardContent>
            </Card>

            <AiSourcesCards sources={analysis.sources} title="Sources utilisees" />
          </>
        ) : null}
      </div>
    </ResponsiveCrudPanel>
  );
}
