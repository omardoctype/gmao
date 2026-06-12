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
import { equipmentSchema, type EquipmentFormValues } from "@/pages/equipments/equipment.schema";

const DEFAULT_FORM_VALUES: EquipmentFormValues = {
  code: "",
  name: "",
  category: "",
  brand: "",
  model: "",
  serialNumber: "",
  location: "",
  status: "OPERATIONAL",
  criticality: "MEDIUM",
  installationDate: "",
  description: "",
};

interface EquipmentFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  loadingInitialData: boolean;
  submitting: boolean;
  initialValues?: EquipmentFormValues;
  onClose: () => void;
  onSubmit: (values: EquipmentFormValues) => Promise<void>;
}

export function EquipmentFormDrawer({
  open,
  mode,
  loadingInitialData,
  submitting,
  initialValues,
  onClose,
  onSubmit,
}: EquipmentFormDrawerProps) {
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
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

    form.reset(DEFAULT_FORM_VALUES);
  }, [open, initialValues, form]);

  if (!open) {
    return null;
  }
  const formId = "equipment-crud-form";

  return (
    <ResponsiveCrudPanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer le formulaire equipement"
      title={mode === "create" ? "Creer un equipement" : "Modifier l'equipement"}
      description={
        mode === "create"
          ? "Ajoute un nouvel actif industriel dans le parc."
          : "Mets a jour les informations techniques de l'actif."
      }
      maxWidthClassName="md:max-w-4xl lg:max-w-5xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form={formId} className="w-full sm:w-auto" disabled={submitting || loadingInitialData}>
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
            <FormField htmlFor="code" label="Code" required error={form.formState.errors.code?.message}>
              <Input id="code" placeholder="EQ-001" {...form.register("code")} />
            </FormField>
            <FormField htmlFor="name" label="Nom" required error={form.formState.errors.name?.message}>
              <Input id="name" placeholder="Presse hydraulique 12T" {...form.register("name")} />
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField
              htmlFor="category"
              label="Categorie"
              required
              error={form.formState.errors.category?.message}
            >
              <Input id="category" placeholder="Hydraulique" {...form.register("category")} />
            </FormField>
            <FormField htmlFor="location" label="Localisation" error={form.formState.errors.location?.message}>
              <Input id="location" placeholder="Atelier A - Ligne 2" {...form.register("location")} />
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField htmlFor="brand" label="Marque" error={form.formState.errors.brand?.message}>
              <Input id="brand" placeholder="Siemens" {...form.register("brand")} />
            </FormField>
            <FormField htmlFor="model" label="Modele" error={form.formState.errors.model?.message}>
              <Input id="model" placeholder="X1200" {...form.register("model")} />
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField htmlFor="serialNumber" label="Numero de serie" error={form.formState.errors.serialNumber?.message}>
              <Input id="serialNumber" placeholder="SN-334-889" {...form.register("serialNumber")} />
            </FormField>
            <FormField
              htmlFor="installationDate"
              label="Date d'installation"
              error={form.formState.errors.installationDate?.message}
            >
              <Input id="installationDate" type="date" {...form.register("installationDate")} />
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField htmlFor="status" label="Statut" required error={form.formState.errors.status?.message}>
              <Select id="status" {...form.register("status")}>
                <option value="OPERATIONAL">Operationnel</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Hors service</option>
              </Select>
            </FormField>
            <FormField
              htmlFor="criticality"
              label="Criticite"
              required
              error={form.formState.errors.criticality?.message}
            >
              <Select id="criticality" {...form.register("criticality")}>
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
                <option value="CRITICAL">Critique</option>
              </Select>
            </FormField>
          </div>

          <FormField
            htmlFor="description"
            label="Description"
            hint="Contexte technique ou informations utiles pour la maintenance."
            error={form.formState.errors.description?.message}
          >
            <Textarea id="description" rows={4} {...form.register("description")} />
          </FormField>
        </form>
      )}
    </ResponsiveCrudPanel>
  );
}
