import { type ChangeEvent, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, FileText, ImagePlus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ResponsiveCrudPanel } from "@/components/ui/responsive-crud-panel";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/toast-context";
import {
  type WorkOrderInterventionReportFormValues,
  workOrderInterventionReportSchema,
} from "@/pages/work-orders/work-order.schema";
import {
  ATTACHMENT_MAX_FILES,
  formatAttachmentFileSize,
  validateAttachmentFiles,
} from "@/services/attachment-service";
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
  onSubmit: (values: WorkOrderInterventionReportFormValues, finalPhotoFiles: File[]) => Promise<void>;
}

export function WorkOrderInterventionReportDrawer({
  open,
  submitting,
  workOrder,
  onClose,
  onSubmit,
}: WorkOrderInterventionReportDrawerProps) {
  const toast = useToast();
  const form = useForm<WorkOrderInterventionReportFormValues>({
    resolver: zodResolver(workOrderInterventionReportSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const [finalPhotoFiles, setFinalPhotoFiles] = useState<File[]>([]);
  const [photoInputKey, setPhotoInputKey] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(DEFAULT_FORM_VALUES);
    setFinalPhotoFiles([]);
    setPhotoInputKey((previous) => previous + 1);
  }, [open, form]);

  if (!open || !workOrder) {
    return null;
  }

  const formId = "work-order-intervention-report-form";

  const handleFinalPhotoFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    const validationError = nextFiles.length > 0 ? validateAttachmentFiles(nextFiles) : null;

    if (validationError) {
      toast.error(validationError);
      setFinalPhotoFiles([]);
      setPhotoInputKey((previous) => previous + 1);
      return;
    }

    setFinalPhotoFiles(nextFiles);
  };

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
      <form id={formId} className="ds-form" onSubmit={form.handleSubmit((values) => onSubmit(values, finalPhotoFiles))}>
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

        <div className="rounded-lg border border-border bg-surface-elevated p-3">
          <div className="mb-3 flex items-start gap-3">
            <ImagePlus className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Photos finales de l'intervention</p>
              <p className="text-xs text-muted-foreground">
                Optionnel pendant la cloture. JPEG, PNG ou WebP, {ATTACHMENT_MAX_FILES} images maximum.
              </p>
            </div>
          </div>
          <Input
            key={photoInputKey}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={submitting}
            onChange={handleFinalPhotoFilesChange}
          />
          {finalPhotoFiles.length > 0 ? (
            <div className="mt-3 space-y-2">
              {finalPhotoFiles.map((file) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatAttachmentFileSize(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Retirer ${file.name}`}
                    onClick={() =>
                      setFinalPhotoFiles((currentFiles) => currentFiles.filter((currentFile) => currentFile !== file))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
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
