import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode, useId } from "react";
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

interface FieldChildProps {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export function FormField({ htmlFor, label, hint, error, required, className, children }: FormFieldProps) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;
  const hintId = `${generatedId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const enhancedChildren = Children.map(children, (child) => {
    if (!isValidElement<FieldChildProps>(child)) {
      return child;
    }

    if (child.props.id && child.props.id !== htmlFor) {
      return child;
    }

    return cloneElement(child as ReactElement<FieldChildProps>, {
      "aria-describedby": describedBy,
      "aria-invalid": Boolean(error) || undefined,
    });
  });

  return (
    <div className={cn("ds-field", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {enhancedChildren}
      {error ? (
        <p id={errorId} className="ds-error" role="alert">
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p id={hintId} className="ds-help">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
