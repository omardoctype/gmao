import { type ReactNode, useId } from "react";
import { X } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OverlayPortal } from "@/components/ui/overlay";
import { useModalOverlay } from "@/components/ui/overlay-hooks";

interface ResponsiveCrudPanelProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  closeLabel?: string;
  maxWidthClassName?: string;
  panelClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export function ResponsiveCrudPanel({
  open,
  title,
  description,
  closeLabel = "Fermer la fenetre",
  maxWidthClassName = "md:max-w-4xl lg:max-w-5xl",
  panelClassName,
  bodyClassName,
  footerClassName,
  footer,
  onClose,
  children,
}: ResponsiveCrudPanelProps) {
  const isMobile = useMobile();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useModalOverlay<HTMLElement>({ open, onClose });

  if (!open) {
    return null;
  }

  return (
    <OverlayPortal>
      <button
        type="button"
        className="fixed inset-0 z-layer-dialog-backdrop bg-foreground/35 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label={closeLabel}
      />

      <div
        className={cn(
          "fixed inset-0 z-layer-dialog flex",
          isMobile ? "items-end justify-stretch p-0" : "items-center justify-center p-4 md:p-6",
        )}
      >
        <section
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            "flex w-full flex-col border border-border bg-surface shadow-panel outline-none",
            maxWidthClassName,
            isMobile ? "h-[92dvh] rounded-t-2xl" : "max-h-[90dvh] rounded-2xl",
            panelClassName,
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-xl font-semibold text-foreground">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>

            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={closeLabel}>
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5", bodyClassName)}>{children}</div>

            {footer ? (
              <footer className={cn("shrink-0 border-t border-border bg-surface px-4 py-3 md:px-6 md:py-4", footerClassName)}>
                {footer}
              </footer>
            ) : null}
          </div>
        </section>
      </div>
    </OverlayPortal>
  );
}
