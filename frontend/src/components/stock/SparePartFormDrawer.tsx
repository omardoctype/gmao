import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ResponsiveCrudPanel } from "@/components/ui/responsive-crud-panel";
import { sparePartSchema, type SparePartFormValues } from "@/pages/stock/stock.schema";

const DEFAULT_FORM_VALUES: SparePartFormValues = {
  reference: "",
  name: "",
  category: "",
  quantityInStock: 0,
  minimumThreshold: 0,
  unitPrice: "",
};

interface SparePartFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  loadingInitialData: boolean;
  submitting: boolean;
  initialValues?: SparePartFormValues;
  onClose: () => void;
  onSubmit: (values: SparePartFormValues) => Promise<void>;
}

export function SparePartFormDrawer({
  open,
  mode,
  loadingInitialData,
  submitting,
  initialValues,
  onClose,
  onSubmit,
}: SparePartFormDrawerProps) {
  const form = useForm<SparePartFormValues>({
    resolver: zodResolver(sparePartSchema),
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
  const formId = "spare-part-crud-form";

  return (
    <ResponsiveCrudPanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer le formulaire piece"
      title={mode === "create" ? "Ajouter une piece" : "Modifier la piece"}
      description={
        mode === "create"
          ? "Cree une nouvelle reference de piece de rechange."
          : "Mets a jour les informations de la piece."
      }
      maxWidthClassName="md:max-w-4xl lg:max-w-5xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form={formId} className="w-full sm:w-auto" disabled={submitting || loadingInitialData}>
            {submitting ? "Enregistrement..." : mode === "create" ? "Ajouter" : "Mettre a jour"}
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
              <Input id="reference" placeholder="SP-2026-001" {...form.register("reference")} />
            </FormField>
            <FormField htmlFor="name" label="Designation" required error={form.formState.errors.name?.message}>
              <Input id="name" placeholder="Roulement 6205" {...form.register("name")} />
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField htmlFor="category" label="Categorie" required error={form.formState.errors.category?.message}>
              <Input id="category" placeholder="Mecanique" {...form.register("category")} />
            </FormField>
            <FormField htmlFor="unitPrice" label="Prix unitaire (DT)" required error={form.formState.errors.unitPrice?.message}>
              <Input id="unitPrice" type="number" min="0" step="0.01" {...form.register("unitPrice")} />
            </FormField>
          </div>

          <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
            <FormField
              htmlFor="quantityInStock"
              label="Stock initial"
              required
              error={form.formState.errors.quantityInStock?.message}
            >
              <Input
                id="quantityInStock"
                type="number"
                min="0"
                {...form.register("quantityInStock", {
                  setValueAs: (value: string) => Number(value),
                })}
              />
            </FormField>
            <FormField
              htmlFor="minimumThreshold"
              label="Seuil minimum"
              required
              error={form.formState.errors.minimumThreshold?.message}
            >
              <Input
                id="minimumThreshold"
                type="number"
                min="0"
                {...form.register("minimumThreshold", {
                  setValueAs: (value: string) => Number(value),
                })}
              />
            </FormField>
          </div>
        </form>
      )}
    </ResponsiveCrudPanel>
  );
}
