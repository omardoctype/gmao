import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalOverlay } from "@/components/ui/overlay-hooks";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function OverlayPortal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

interface ResponsiveSidePanelProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  closeLabel?: string;
  maxWidthClassName?: string;
  bodyClassName?: string;
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export function ResponsiveSidePanel({
  open,
  title,
  description,
  closeLabel = "Fermer le panneau",
  maxWidthClassName = "md:max-w-lg",
  bodyClassName,
  footer,
  onClose,
  children,
}: ResponsiveSidePanelProps) {
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
        className="fixed inset-0 z-layer-dialog-backdrop bg-foreground/30 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label={closeLabel}
      />

      <div
        className={cn(
          "fixed inset-0 z-layer-dialog flex",
          isMobile ? "items-end justify-stretch p-0" : "items-stretch justify-end",
        )}
      >
        <aside
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            "flex w-full flex-col border-border bg-surface shadow-panel outline-none",
            isMobile ? "max-h-[92dvh] rounded-t-2xl border-t" : "h-dvh border-l",
            maxWidthClassName,
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-4 md:px-5">
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

          <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5", bodyClassName)}>{children}</div>

          {footer ? (
            <footer className="shrink-0 border-t border-border bg-surface px-4 py-3 md:px-5 md:py-4">{footer}</footer>
          ) : null}
        </aside>
      </div>
    </OverlayPortal>
  );
}

interface AnchoredPopoverProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  className?: string;
  role?: "dialog" | "menu";
  align?: "start" | "end";
  sideOffset?: number;
  collisionPadding?: number;
  onClose: () => void;
  children: ReactNode;
}

interface PopoverPosition {
  top: number;
  left: number;
  maxHeight: number;
  visibility: "hidden" | "visible";
}

function calculatePopoverPosition({
  anchor,
  panel,
  align,
  sideOffset,
  collisionPadding,
}: {
  anchor: HTMLElement;
  panel: HTMLElement;
  align: "start" | "end";
  sideOffset: number;
  collisionPadding: number;
}): PopoverPosition {
  const anchorRect = anchor.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const panelWidth = panelRect.width;
  const panelHeight = panelRect.height;

  const preferredLeft = align === "end" ? anchorRect.right - panelWidth : anchorRect.left;
  const maxLeft = Math.max(collisionPadding, viewportWidth - panelWidth - collisionPadding);
  const left = Math.min(Math.max(preferredLeft, collisionPadding), maxLeft);

  const spaceBelow = viewportHeight - anchorRect.bottom - collisionPadding - sideOffset;
  const spaceAbove = anchorRect.top - collisionPadding - sideOffset;
  const shouldOpenAbove = panelHeight > spaceBelow && spaceAbove > spaceBelow;

  if (shouldOpenAbove) {
    const maxHeight = Math.max(160, spaceAbove);
    const top = Math.max(collisionPadding, anchorRect.top - Math.min(panelHeight, maxHeight) - sideOffset);
    return { top, left, maxHeight, visibility: "visible" };
  }

  const maxHeight = Math.max(160, spaceBelow);
  const top = Math.min(anchorRect.bottom + sideOffset, viewportHeight - collisionPadding);
  return { top, left, maxHeight, visibility: "visible" };
}

export function AnchoredPopover({
  open,
  anchorRef,
  className,
  role = "dialog",
  align = "end",
  sideOffset = 8,
  collisionPadding = 12,
  onClose,
  children,
}: AnchoredPopoverProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<PopoverPosition>({
    top: collisionPadding,
    left: collisionPadding,
    maxHeight: 320,
    visibility: "hidden",
  });

  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) {
        return;
      }

      setPosition(calculatePopoverPosition({ anchor, panel, align, sideOffset, collisionPadding }));
    };

    updatePosition();
    const animationFrame = window.requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, anchorRef, collisionPadding, open, sideOffset]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, onClose, open]);

  if (!open) {
    return null;
  }

  const style: CSSProperties = {
    left: position.left,
    top: position.top,
    maxHeight: position.maxHeight,
    visibility: position.visibility,
  };

  return (
    <OverlayPortal>
      <div
        ref={panelRef}
        role={role}
        className={cn("fixed z-layer-popover overflow-y-auto rounded-lg border border-border bg-card shadow-panel outline-none", className)}
        style={style}
      >
        {children}
      </div>
    </OverlayPortal>
  );
}
