import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { breakdownStatusSchema, type BreakdownStatusFormValues } from "@/pages/breakdowns/breakdown.schema";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
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
    <>
      <button type="button" className="fixed inset-0 z-40 bg-foreground/30" onClick={onClose} aria-label="Fermer le panneau statut" />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-surface shadow-panel">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Mettre a jour le statut</h2>
              <p className="text-sm text-muted-foreground">Qualification de l'etat de la panne.</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 px-5 py-4">
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
          </div>
        </div>
      </aside>
    </>
  );
}
