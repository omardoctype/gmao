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
import {
  maintenancePlanSchema,
  type MaintenancePlanFormValues,
} from "@/pages/maintenance-plans/maintenance-plan.schema";

export interface MaintenancePlanEquipmentOption {
  id: number;
  code: string;
  name: string;
}

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_FORM_VALUES: MaintenancePlanFormValues = {
  type: "PREVENTIVE",
  frequency: "MONTHLY",
  nextExecutionDate: "",
  description: "",
  equipmentId: 0,
};

interface MaintenancePlanFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  loadingInitialData: boolean;
  submitting: boolean;
  initialValues?: MaintenancePlanFormValues;
  equipmentOptions: MaintenancePlanEquipmentOption[];
  onClose: () => void;
  onSubmit: (values: MaintenancePlanFormValues) => Promise<void>;
}

export function MaintenancePlanFormDrawer({
  open,
  mode,
  loadingInitialData,
  submitting,
  initialValues,
  equipmentOptions,
  onClose,
  onSubmit,
}: MaintenancePlanFormDrawerProps) {
  const form = useForm<MaintenancePlanFormValues>({
    resolver: zodResolver(maintenancePlanSchema),
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
      nextExecutionDate: todayDateInputValue(),
    });
  }, [open, initialValues, equipmentOptions, form]);

  if (!open) {
    return null;
  }
  const formId = "maintenance-plan-crud-form";

  return (
    <ResponsiveCrudPanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer le formulaire plan de maintenance"
      title={mode === "create" ? "Creer un plan de maintenance" : "Modifier le plan de maintenance"}
      description="Structure simple et evolutive, prete pour une future generation automatique d'ordres de travail."
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
            <FormField htmlFor="type" label="Type" required error={form.formState.errors.type?.message}>
              <Select id="type" {...form.register("type")}>
                <option value="PREVENTIVE">Preventif</option>
                <option value="PREDICTIVE">Predictif</option>
                <option value="LEGAL">Reglementaire</option>
                <option value="CONDITION_BASED">Conditionnel</option>
                <option value="OTHER">Autre</option>
              </Select>
            </FormField>

            <FormField htmlFor="frequency" label="Frequence" required error={form.formState.errors.frequency?.message}>
              <Select id="frequency" {...form.register("frequency")}>
                <option value="DAILY">Quotidienne</option>
                <option value="WEEKLY">Hebdomadaire</option>
                <option value="MONTHLY">Mensuelle</option>
                <option value="QUARTERLY">Trimestrielle</option>
                <option value="SEMI_ANNUAL">Semestrielle</option>
                <option value="ANNUAL">Annuelle</option>
              </Select>
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField
              htmlFor="nextExecutionDate"
              label="Prochaine execution"
              required
              error={form.formState.errors.nextExecutionDate?.message}
            >
              <Input id="nextExecutionDate" type="date" {...form.register("nextExecutionDate")} />
            </FormField>

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
          </div>

          <FormField htmlFor="description" label="Description" required error={form.formState.errors.description?.message}>
            <Textarea
              id="description"
              rows={5}
              placeholder="Exemple: Controle vibration + verification lubrification + test securite."
              {...form.register("description")}
            />
          </FormField>
        </form>
      )}
    </ResponsiveCrudPanel>
  );
}
