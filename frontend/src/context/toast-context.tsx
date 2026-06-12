import { createContext, useContext, useMemo, useState } from "react";
import { ToastStack, type ToastItem, type ToastType } from "@/components/ui/toast-stack";

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId(): number {
  return Date.now() + Math.floor(Math.random() * 10000);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const pushToast = (type: ToastType, message: string) => {
    const id = createToastId();

    setToasts((prevToasts) => [...prevToasts, { id, type, message }].slice(-4));
    window.setTimeout(() => removeToast(id), 4200);
  };

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message: string) => pushToast("success", message),
      error: (message: string) => pushToast("error", message),
      info: (message: string) => pushToast("info", message),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
