import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { stockMovementSchema, type StockMovementFormValues } from "@/pages/stock/stock.schema";
import type { SparePart } from "@/types/stock";

interface StockMovementDrawerProps {
  open: boolean;
  mode: "IN" | "OUT";
  loading: boolean;
  sparePart: SparePart | null;
  onClose: () => void;
  onSubmit: (values: StockMovementFormValues) => Promise<void>;
}

export function StockMovementDrawer({
  open,
  mode,
  loading,
  sparePart,
  onClose,
  onSubmit,
}: StockMovementDrawerProps) {
  const form = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({ quantity: 1 });
  }, [open, form]);

  if (!open || !sparePart) {
    return null;
  }

  const isStockIn = mode === "IN";
  const title = isStockIn ? "Entree de stock" : "Sortie de stock";
  const helper = isStockIn
    ? "Ajoute de la quantite au stock actuel."
    : "Retire de la quantite du stock actuel.";

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-foreground/30"
        onClick={onClose}
        aria-label="Fermer le mouvement"
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-surface shadow-panel">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{helper}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 px-5 py-4">
            <div className="rounded-md border border-border bg-surface-elevated px-3 py-2">
              <p className="text-xs text-muted-foreground">Piece</p>
              <p className="text-sm font-semibold text-foreground">
                {sparePart.reference} - {sparePart.name}
              </p>
              <p className="text-xs text-muted-foreground">Stock actuel: {sparePart.quantityInStock}</p>
            </div>

            <form className="ds-form" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField htmlFor="quantity" label="Quantite" required error={form.formState.errors.quantity?.message}>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  {...form.register("quantity", {
                    setValueAs: (value: string) => Number(value),
                  })}
                />
              </FormField>

              <div className="ds-button-group pt-2">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                  {isStockIn ? <ArrowUpCircle className="mr-2 h-4 w-4" /> : <ArrowDownCircle className="mr-2 h-4 w-4" />}
                  {loading ? "Validation..." : isStockIn ? "Valider entree" : "Valider sortie"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
