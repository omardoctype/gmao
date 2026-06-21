import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ResponsiveSidePanel } from "@/components/ui/overlay";
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
    <ResponsiveSidePanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer l'affectation"
      title="Affecter un technicien"
      description={`Ordre: ${workOrder.reference}`}
      maxWidthClassName="md:max-w-md"
    >
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
    </ResponsiveSidePanel>
  );
}
