import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

let bodyLockCount = 0;
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";
let modalStack: symbol[] = [];

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
  );
}

function getLastModalId(): symbol | undefined {
  return modalStack[modalStack.length - 1];
}

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  bodyLockCount += 1;
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);

  if (bodyLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.paddingRight = previousBodyPaddingRight;
  }
}

function removeModalId(id: symbol) {
  modalStack = modalStack.filter((modalId) => modalId !== id);
}

function getInitialFocusTarget(container: HTMLElement, preferredTarget?: HTMLElement | null): HTMLElement {
  if (preferredTarget && container.contains(preferredTarget)) {
    return preferredTarget;
  }

  return getFocusableElements(container)[0] ?? container;
}

export function useModalOverlay<TElement extends HTMLElement = HTMLElement>({
  open,
  onClose,
  initialFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  const containerRef = useRef<TElement | null>(null);
  const modalIdRef = useRef(Symbol("modal-overlay"));
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const modalId = modalIdRef.current;
    modalStack.push(modalId);
    lockBodyScroll();
    previousActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTimer = window.setTimeout(() => {
      const container = containerRef.current;
      if (!container || getLastModalId() !== modalId) {
        return;
      }

      getInitialFocusTarget(container, initialFocusRef?.current).focus({ preventScroll: true });
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (getLastModalId() !== modalId) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      removeModalId(modalId);
      unlockBodyScroll();

      const previousActiveElement = previousActiveElementRef.current;
      if (previousActiveElement && document.contains(previousActiveElement)) {
        previousActiveElement.focus({ preventScroll: true });
      }
    };
  }, [initialFocusRef, onClose, open]);

  return containerRef;
}
