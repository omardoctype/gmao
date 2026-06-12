import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  htmlFor: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function FormField({ htmlFor, label, hint, error, required, className, children }: FormFieldProps) {
  return (
    <div className={cn("ds-field", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="ds-error">{error}</p> : null}
      {!error && hint ? <p className="ds-help">{hint}</p> : null}
    </div>
  );
}
