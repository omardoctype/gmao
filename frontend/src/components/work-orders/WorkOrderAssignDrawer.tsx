import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UserRoundPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { type WorkOrderAssignFormValues, workOrderAssignSchema } from "@/pages/work-orders/work-order.schema";
import type { WorkOrder } from "@/types/work-order";

interface WorkOrderAssignDrawerProps {
  open: boolean;
  loading: boolean;
  workOrder: WorkOrder | null;
  onClose: () => void;
  onSubmit: (values: WorkOrderAssignFormValues) => Promise<void>;
}

export function WorkOrderAssignDrawer({ open, loading, workOrder, onClose, onSubmit }: WorkOrderAssignDrawerProps) {
  const form = useForm<WorkOrderAssignFormValues>({
    resolver: zodResolver(workOrderAssignSchema),
    defaultValues: {
      technicianId: workOrder?.assignedTechnicianId ?? 0,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      technicianId: workOrder?.assignedTechnicianId ?? 0,
    });
  }, [open, workOrder, form]);

  if (!open || !workOrder) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-foreground/30"
        onClick={onClose}
        aria-label="Fermer l'affectation"
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-surface shadow-panel">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Affecter un technicien</h2>
              <p className="text-sm text-muted-foreground">Ordre: {workOrder.reference}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-5 py-4">
            <form className="ds-form" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                htmlFor="technicianId"
                label="Identifiant technicien"
                required
                hint="Entrez l'ID utilisateur du technicien."
                error={form.formState.errors.technicianId?.message}
              >
                <Input
                  id="technicianId"
                  type="number"
                  min="1"
                  {...form.register("technicianId", {
                    setValueAs: (value: string) => Number(value),
                  })}
                />
              </FormField>

              <div className="ds-button-group pt-2">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                  <UserRoundPlus className="mr-2 h-4 w-4" />
                  {loading ? "Affectation..." : "Affecter"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
