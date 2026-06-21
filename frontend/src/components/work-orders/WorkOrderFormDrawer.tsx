import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ResponsiveCrudPanel } from "@/components/ui/responsive-crud-panel";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { workOrderSchema, type WorkOrderFormValues } from "@/pages/work-orders/work-order.schema";

export interface WorkOrderEquipmentOption {
  id: number;
  code: string;
  name: string;
}

export interface WorkOrderBreakdownOption {
  id: number;
  reference: string;
  title: string;
}

const DEFAULT_FORM_VALUES: WorkOrderFormValues = {
  reference: "",
  type: "CORRECTIVE",
  status: "CREATED",
  priority: "MEDIUM",
  plannedDate: "",
  estimatedDurationMinutes: "",
  estimatedCost: "",
  realCost: "",
  description: "",
  equipmentId: 0,
  breakdownId: null,
};

function toNumberOrNull(value: string): number | null {
  if (!value || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

interface WorkOrderFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  loadingInitialData: boolean;
  submitting: boolean;
  initialValues?: WorkOrderFormValues;
  equipmentOptions: WorkOrderEquipmentOption[];
  breakdownOptions: WorkOrderBreakdownOption[];
  onClose: () => void;
  onSubmit: (values: WorkOrderFormValues) => Promise<void>;
}

export function WorkOrderFormDrawer({
  open,
  mode,
  loadingInitialData,
  submitting,
  initialValues,
  equipmentOptions,
  breakdownOptions,
  onClose,
  onSubmit,
}: WorkOrderFormDrawerProps) {
  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialValues) {
      form.reset(initialValues);
      return;
    }

    form.reset({
      ...DEFAULT_FORM_VALUES,
      equipmentId: equipmentOptions[0]?.id ?? 0,
    });
  }, [open, initialValues, equipmentOptions, form]);

  if (!open) {
    return null;
  }
  const formId = "work-order-crud-form";

  return (
    <ResponsiveCrudPanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer le formulaire ordre de travail"
      title={mode === "create" ? "Creer un ordre de travail" : "Modifier l'ordre de travail"}
      description={
        mode === "create"
          ? "Preparation de l'intervention et informations initiales."
          : "Mise a jour des informations d'execution et de planification."
      }
      maxWidthClassName="md:max-w-4xl lg:max-w-5xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            form={formId}
            className="w-full sm:w-auto"
            disabled={submitting || loadingInitialData || equipmentOptions.length === 0}
          >
            {submitting ? "Enregistrement..." : mode === "create" ? "Creer" : "Mettre a jour"}
          </Button>
        </div>
      }
    >
      {loadingInitialData ? (
        <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <form id={formId} className="ds-form" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField htmlFor="reference" label="Reference" required error={form.formState.errors.reference?.message}>
              <Input id="reference" placeholder="OT-2026-001" {...form.register("reference")} />
            </FormField>
            <FormField htmlFor="type" label="Type" required error={form.formState.errors.type?.message}>
              <Select id="type" {...form.register("type")}>
                <option value="CORRECTIVE">Corrective</option>
                <option value="PREVENTIVE">Preventive</option>
                <option value="INSPECTION">Inspection</option>
                <option value="INSTALLATION">Installation</option>
                <option value="OTHER">Autre</option>
              </Select>
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField htmlFor="priority" label="Priorite" required error={form.formState.errors.priority?.message}>
              <Select id="priority" {...form.register("priority")}>
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
                <option value="CRITICAL">Critique</option>
              </Select>
            </FormField>
            <FormField htmlFor="status" label="Statut" required error={form.formState.errors.status?.message}>
              <Select id="status" {...form.register("status")} disabled={mode === "create"}>
                <option value="CREATED">Cree</option>
                <option value="ASSIGNED">Affecte</option>
                <option value="ACCEPTED">Pris en charge</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="COMPLETED">Cloture</option>
                <option value="CANCELLED">Annule</option>
              </Select>
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField htmlFor="equipmentId" label="Equipement" required error={form.formState.errors.equipmentId?.message}>
              <Select
                id="equipmentId"
                {...form.register("equipmentId", {
                  setValueAs: (value: string) => Number(value),
                })}
              >
                {equipmentOptions.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.code} - {equipment.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField htmlFor="breakdownId" label="Panne associee" error={form.formState.errors.breakdownId?.message}>
              <Select
                id="breakdownId"
                {...form.register("breakdownId", {
                  setValueAs: (value: string) => toNumberOrNull(value),
                })}
              >
                <option value="">Aucune panne</option>
                {breakdownOptions.map((breakdown) => (
                  <option key={breakdown.id} value={breakdown.id}>
                    {breakdown.reference} - {breakdown.title}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField htmlFor="plannedDate" label="Date planifiee" error={form.formState.errors.plannedDate?.message}>
              <Input id="plannedDate" type="datetime-local" {...form.register("plannedDate")} />
            </FormField>
            <FormField
              htmlFor="estimatedDurationMinutes"
              label="Duree estimee"
              hint="Exemple : 120 minutes = 2 heures."
              error={form.formState.errors.estimatedDurationMinutes?.message}
            >
              <Input
                id="estimatedDurationMinutes"
                type="number"
                min="0"
                step="1"
                placeholder="120"
                {...form.register("estimatedDurationMinutes")}
              />
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField htmlFor="estimatedCost" label="Cout estime" error={form.formState.errors.estimatedCost?.message}>
              <Input id="estimatedCost" type="number" min="0" step="0.01" {...form.register("estimatedCost")} />
            </FormField>
            <FormField htmlFor="realCost" label="Cout reel" error={form.formState.errors.realCost?.message}>
              <Input id="realCost" type="number" min="0" step="0.01" {...form.register("realCost")} />
            </FormField>
          </div>

          <FormField htmlFor="description" label="Description" required error={form.formState.errors.description?.message}>
            <Textarea id="description" rows={4} {...form.register("description")} />
          </FormField>
        </form>
      )}
    </ResponsiveCrudPanel>
  );
}
