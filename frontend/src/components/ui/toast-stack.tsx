import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

function toneConfig(type: ToastType): { icon: LucideIcon; className: string } {
  if (type === "success") {
    return {
      icon: CheckCircle2,
      className: "border-success/30 bg-success/10 text-success",
    };
  }

  if (type === "error") {
    return {
      icon: AlertCircle,
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    };
  }

  return {
    icon: Info,
    className: "border-primary/30 bg-primary/10 text-primary",
  };
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4 sm:inset-x-auto sm:right-4 sm:top-5 sm:w-[380px] sm:justify-end sm:px-0">
      <div className="flex w-full max-w-md flex-col gap-2">
        {toasts.map((toast) => {
          const { icon: Icon, className } = toneConfig(toast.type);

          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto animate-fade-in-up rounded-lg border px-3 py-2 shadow-panel backdrop-blur",
                className,
              )}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => onDismiss(toast.id)}
                  aria-label="Fermer la notification"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
