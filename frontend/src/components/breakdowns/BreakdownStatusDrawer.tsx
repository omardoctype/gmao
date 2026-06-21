import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { breakdownStatusSchema, type BreakdownStatusFormValues } from "@/pages/breakdowns/breakdown.schema";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ResponsiveSidePanel } from "@/components/ui/overlay";
import { Select } from "@/components/ui/select";

interface BreakdownStatusDrawerProps {
  open: boolean;
  loading: boolean;
  initialStatus: BreakdownStatusFormValues["status"] | null;
  onClose: () => void;
  onSubmit: (values: BreakdownStatusFormValues) => Promise<void>;
}

export function BreakdownStatusDrawer({
  open,
  loading,
  initialStatus,
  onClose,
  onSubmit,
}: BreakdownStatusDrawerProps) {
  const form = useForm<BreakdownStatusFormValues>({
    resolver: zodResolver(breakdownStatusSchema),
    defaultValues: { status: "DECLARED" },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({ status: initialStatus ?? "DECLARED" });
  }, [open, initialStatus, form]);

  if (!open) {
    return null;
  }

  return (
    <ResponsiveSidePanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer le panneau statut"
      title="Mettre a jour le statut"
      description="Qualification de l'etat de la panne."
      maxWidthClassName="md:max-w-md"
    >
      <form className="ds-form" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField htmlFor="status" label="Statut" required error={form.formState.errors.status?.message}>
                <Select id="status" {...form.register("status")}>
                  <option value="DECLARED">Declaree</option>
                  <option value="QUALIFIED">Qualifiee</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="RESOLVED">Resolue</option>
                </Select>
              </FormField>

              <div className="ds-button-group pt-2">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                  {loading ? "Mise a jour..." : "Mettre a jour"}
                </Button>
              </div>
      </form>
    </ResponsiveSidePanel>
  );
}
