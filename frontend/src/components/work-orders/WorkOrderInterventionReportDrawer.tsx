import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ResponsiveCrudPanel } from "@/components/ui/responsive-crud-panel";
import { Textarea } from "@/components/ui/textarea";
import {
  type WorkOrderInterventionReportFormValues,
  workOrderInterventionReportSchema,
} from "@/pages/work-orders/work-order.schema";
import type { WorkOrder } from "@/types/work-order";

const DEFAULT_FORM_VALUES: WorkOrderInterventionReportFormValues = {
  performedTasks: "",
  realDiagnosis: "",
  rootCause: "",
  usedParts: "",
  interventionDurationMinutes: "",
  finalResult: "",
  futureRecommendations: "",
};

interface WorkOrderInterventionReportDrawerProps {
  open: boolean;
  submitting: boolean;
  workOrder: WorkOrder | null;
  onClose: () => void;
  onSubmit: (values: WorkOrderInterventionReportFormValues) => Promise<void>;
}

export function WorkOrderInterventionReportDrawer({
  open,
  submitting,
  workOrder,
  onClose,
  onSubmit,
}: WorkOrderInterventionReportDrawerProps) {
  const form = useForm<WorkOrderInterventionReportFormValues>({
    resolver: zodResolver(workOrderInterventionReportSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(DEFAULT_FORM_VALUES);
  }, [open, form]);

  if (!open || !workOrder) {
    return null;
  }

  const formId = "work-order-intervention-report-form";

  return (
    <ResponsiveCrudPanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer le rapport d'intervention"
      title="Cloturer avec rapport"
      description={`${workOrder.reference} - ${workOrder.equipmentCode} ${workOrder.equipmentName}`}
      maxWidthClassName="md:max-w-3xl lg:max-w-4xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form={formId} className="w-full sm:w-auto" disabled={submitting}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {submitting ? "Cloture..." : "Cloturer et attacher le rapport"}
          </Button>
        </div>
      }
    >
      <form id={formId} className="ds-form" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="rounded-lg border border-border bg-surface-elevated px-4 py-3">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Rapport terrain obligatoire</p>
              <p className="text-sm text-muted-foreground">
                Le rapport sera sauvegarde, lie a l'OT et ajoute automatiquement aux documents de l'equipement.
              </p>
            </div>
          </div>
        </div>

        <FormField
          htmlFor="performedTasks"
          label="Travaux effectues"
          required
          error={form.formState.errors.performedTasks?.message}
        >
          <Textarea
            id="performedTasks"
            rows={5}
            placeholder="Ex: controle moteur, remplacement courroie, nettoyage ventilation, essais en charge..."
            {...form.register("performedTasks")}
          />
        </FormField>

        <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
          <FormField htmlFor="realDiagnosis" label="Diagnostic reel" error={form.formState.errors.realDiagnosis?.message}>
            <Textarea
              id="realDiagnosis"
              rows={4}
              placeholder="Constat reel observe pendant l'intervention..."
              {...form.register("realDiagnosis")}
            />
          </FormField>

          <FormField htmlFor="rootCause" label="Cause racine" error={form.formState.errors.rootCause?.message}>
            <Textarea
              id="rootCause"
              rows={4}
              placeholder="Cause racine si elle est identifiee..."
              {...form.register("rootCause")}
            />
          </FormField>
        </div>

        <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
          <FormField htmlFor="usedParts" label="Pieces utilisees" error={form.formState.errors.usedParts?.message}>
            <Textarea
              id="usedParts"
              rows={4}
              placeholder="Pieces, consommables, references, quantites..."
              {...form.register("usedParts")}
            />
          </FormField>

          <FormField
            htmlFor="interventionDurationMinutes"
            label="Duree intervention"
            hint="Duree en minutes, optionnelle."
            error={form.formState.errors.interventionDurationMinutes?.message}
          >
            <Input
              id="interventionDurationMinutes"
              type="number"
              min="0"
              step="1"
              placeholder="90"
              {...form.register("interventionDurationMinutes")}
            />
          </FormField>
        </div>

        <FormField
          htmlFor="finalResult"
          label="Resultat final"
          required
          error={form.formState.errors.finalResult?.message}
        >
          <Textarea
            id="finalResult"
            rows={4}
            placeholder="Ex: equipement remis en service apres tests, surveillance recommandee..."
            {...form.register("finalResult")}
          />
        </FormField>

        <FormField
          htmlFor="futureRecommendations"
          label="Recommandations futures"
          error={form.formState.errors.futureRecommendations?.message}
        >
          <Textarea
            id="futureRecommendations"
            rows={4}
            placeholder="Actions preventives, controle a planifier, pieces a commander..."
            {...form.register("futureRecommendations")}
          />
        </FormField>
      </form>
    </ResponsiveCrudPanel>
  );
}
