import type { HTMLAttributes } from "react";
import { USER_ROLE_OPTIONS } from "@/components/users/user-roles";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/user";

interface UserRoleCheckboxGroupProps extends HTMLAttributes<HTMLDivElement> {
  selectedRoles: UserRole[];
  onToggleRole: (role: UserRole, checked: boolean) => void;
  error?: string;
}

export function UserRoleCheckboxGroup({
  selectedRoles,
  onToggleRole,
  error,
  className,
  ...props
}: UserRoleCheckboxGroupProps) {
  return (
    <div
      role="group"
      className={cn("rounded-lg border border-border/80 bg-surface-elevated p-3", error && "border-destructive/40", className)}
      {...props}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {USER_ROLE_OPTIONS.map((roleOption) => {
          const isChecked = selectedRoles.includes(roleOption.value);
          return (
            <label
              key={roleOption.value}
              className="flex items-center gap-2 rounded-md border border-border/70 bg-surface px-3 py-2 text-sm text-foreground"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--primary))]"
                checked={isChecked}
                onChange={(event) => onToggleRole(roleOption.value, event.target.checked)}
              />
              <span>{roleOption.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
