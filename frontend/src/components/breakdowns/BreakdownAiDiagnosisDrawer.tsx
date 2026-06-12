import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Brain, LoaderCircle, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { AiSourcesCards } from "@/components/ai-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ResponsiveCrudPanel } from "@/components/ui/responsive-crud-panel";
import { Textarea } from "@/components/ui/textarea";
import { type AiDiagnosisFormValues, aiDiagnosisSchema } from "@/pages/ai-assistant/ai-assistant.schema";
import { getApiErrorMessage, isTimeoutError } from "@/services/api";
import { requestAiDiagnosis } from "@/services/ai-assistant-service";
import type { AiDiagnosisResponse } from "@/types/ai-assistant";
import type { Breakdown } from "@/types/breakdown";

const AI_TIMEOUT_ERROR_MESSAGE = "Le service IA a pris trop de temps a repondre. Veuillez reessayer.";

interface BreakdownAiDiagnosisDrawerProps {
  open: boolean;
  breakdown: Breakdown | null;
  onClose: () => void;
}

export function BreakdownAiDiagnosisDrawer({ open, breakdown, onClose }: BreakdownAiDiagnosisDrawerProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<AiDiagnosisResponse | null>(null);

  const form = useForm<AiDiagnosisFormValues>({
    resolver: zodResolver(aiDiagnosisSchema),
    defaultValues: {
      equipmentCode: "",
      breakdownDescription: "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      equipmentCode: breakdown?.equipmentCode ?? "",
      breakdownDescription: breakdown?.description ?? "",
    });
    setSubmitError(null);
    setResult(null);
  }, [open, breakdown, form]);

  if (!open) {
    return null;
  }

  const formId = "breakdown-ai-diagnosis-form";

  const handleSubmitDiagnosis = async (values: AiDiagnosisFormValues) => {
    setSubmitError(null);
    setResult(null);
    setSubmitting(true);

    try {
      const response = await requestAiDiagnosis({
        equipmentCode: values.equipmentCode.trim(),
        breakdownDescription: values.breakdownDescription.trim(),
      });
      setResult(response);
    } catch (error) {
      setSubmitError(
        isTimeoutError(error)
          ? AI_TIMEOUT_ERROR_MESSAGE
          : getApiErrorMessage(error, "Impossible de generer le diagnostic IA pour cette panne."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveCrudPanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer le diagnostic IA"
      title="Diagnostic IA"
      description="Analyse guidee de la panne avec recommandations et sources documentaires."
      maxWidthClassName="md:max-w-4xl lg:max-w-5xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Fermer
          </Button>
          <Button type="submit" form={formId} className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Analyse IA en cours...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Proposer un diagnostic
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {breakdown ? (
          <Card className="border-border/90 bg-surface">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Panne cible</p>
              <p className="text-sm font-semibold text-foreground">{breakdown.reference}</p>
              <p className="text-xs text-muted-foreground">
                {breakdown.equipmentCode} - {breakdown.equipmentName}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <form id={formId} className="ds-form" onSubmit={form.handleSubmit(handleSubmitDiagnosis)}>
          <FormField
            htmlFor="ai-breakdown-equipment"
            label="Code equipement"
            required
            error={form.formState.errors.equipmentCode?.message}
            hint="Pre-rempli automatiquement depuis la panne."
          >
            <Input id="ai-breakdown-equipment" placeholder="EQ-001" {...form.register("equipmentCode")} />
          </FormField>

          <FormField
            htmlFor="ai-breakdown-description"
            label="Description de la panne"
            required
            error={form.formState.errors.breakdownDescription?.message}
            hint="Pre-remplie si une description existe dans la panne."
          >
            <Textarea
              id="ai-breakdown-description"
              rows={5}
              placeholder="Decrire les symptomes observes..."
              {...form.register("breakdownDescription")}
            />
          </FormField>
        </form>

        {submitting ? (
          <Card className="border-border/90 bg-surface">
            <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
              Analyse IA en cours, cela peut prendre quelques secondes...
            </CardContent>
          </Card>
        ) : null}

        {!submitting && submitError ? (
          <Card className="border-destructive/30 bg-destructive/10">
            <CardContent className="flex items-start gap-2 p-4 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </CardContent>
          </Card>
        ) : null}

        {!submitting && result ? (
          <div className="space-y-3">
            <Card className="border-border/90 bg-surface">
              <CardContent className="space-y-2 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Diagnostic
                </p>
                <p className="text-sm leading-relaxed text-foreground">{result.diagnosis}</p>
              </CardContent>
            </Card>

            <Card className="border-border/90 bg-surface">
              <CardContent className="space-y-2 p-4">
                <p className="text-sm font-semibold text-foreground">Actions recommandees</p>
                {result.recommendedActions.length > 0 ? (
                  <ul className="space-y-2">
                    {result.recommendedActions.map((action, index) => (
                      <li key={`${action}-${index}`} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune action recommandee retournee pour ce diagnostic.</p>
                )}
              </CardContent>
            </Card>

            <AiSourcesCards sources={result.sources} />
          </div>
        ) : null}
      </div>
    </ResponsiveCrudPanel>
  );
}
