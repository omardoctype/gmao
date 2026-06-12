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
import { breakdownSchema, type BreakdownFormValues } from "@/pages/breakdowns/breakdown.schema";

const DEFAULT_FORM_VALUES: BreakdownFormValues = {
  reference: "",
  title: "",
  description: "",
  type: "MECHANICAL",
  priority: "MEDIUM",
  status: "DECLARED",
  equipmentId: 0,
};

export interface BreakdownEquipmentOption {
  id: number;
  code: string;
  name: string;
}

interface BreakdownFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  loadingInitialData: boolean;
  submitting: boolean;
  initialValues?: BreakdownFormValues;
  equipmentOptions: BreakdownEquipmentOption[];
  onClose: () => void;
  onSubmit: (values: BreakdownFormValues) => Promise<void>;
}

export function BreakdownFormDrawer({
  open,
  mode,
  loadingInitialData,
  submitting,
  initialValues,
  equipmentOptions,
  onClose,
  onSubmit,
}: BreakdownFormDrawerProps) {
  const form = useForm<BreakdownFormValues>({
    resolver: zodResolver(breakdownSchema),
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
  const formId = "breakdown-crud-form";

  return (
    <ResponsiveCrudPanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer le formulaire panne"
      title={mode === "create" ? "Declarer une panne" : "Modifier la panne"}
      description={
        mode === "create"
          ? "Saisis les informations essentielles pour la prise en charge."
          : "Mets a jour la qualification technique de la panne."
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
            {submitting ? "Enregistrement..." : mode === "create" ? "Declarer" : "Mettre a jour"}
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
              <Input id="reference" placeholder="PN-2026-001" {...form.register("reference")} />
            </FormField>
            <FormField htmlFor="title" label="Titre" required error={form.formState.errors.title?.message}>
              <Input id="title" placeholder="Arret moteur principal" {...form.register("title")} />
            </FormField>
          </div>

          <FormField htmlFor="description" label="Description" required error={form.formState.errors.description?.message}>
            <Textarea id="description" rows={4} {...form.register("description")} />
          </FormField>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField htmlFor="type" label="Type" required error={form.formState.errors.type?.message}>
              <Select id="type" {...form.register("type")}>
                <option value="MECHANICAL">Mecanique</option>
                <option value="ELECTRICAL">Electrique</option>
                <option value="HYDRAULIC">Hydraulique</option>
                <option value="PNEUMATIC">Pneumatique</option>
                <option value="SOFTWARE">Logicielle</option>
                <option value="OTHER">Autre</option>
              </Select>
            </FormField>
            <FormField htmlFor="priority" label="Priorite" required error={form.formState.errors.priority?.message}>
              <Select id="priority" {...form.register("priority")}>
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
                <option value="CRITICAL">Critique</option>
              </Select>
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField htmlFor="equipmentId" label="Equipement" required error={form.formState.errors.equipmentId?.message}>
              <Select id="equipmentId" {...form.register("equipmentId", { valueAsNumber: true })}>
                {equipmentOptions.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.code} - {equipment.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField htmlFor="status" label="Statut" required error={form.formState.errors.status?.message}>
              <Select id="status" {...form.register("status")} disabled={mode === "create"}>
                <option value="DECLARED">Declaree</option>
                <option value="QUALIFIED">Qualifiee</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="RESOLVED">Resolue</option>
              </Select>
            </FormField>
          </div>
        </form>
      )}
    </ResponsiveCrudPanel>
  );
}
