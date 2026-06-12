import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { UserRoleCheckboxGroup } from "@/components/users/UserRoleCheckboxGroup";
import { UserRoleBadges } from "@/components/users/UserRoleBadges";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { userRoleAssignSchema, type UserRoleAssignFormValues } from "@/pages/users/user.schema";
import type { UserItem, UserRole } from "@/types/user";

interface UserRolesDrawerProps {
  open: boolean;
  user: UserItem | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: UserRoleAssignFormValues) => Promise<void>;
}

export function UserRolesDrawer({ open, user, submitting, onClose, onSubmit }: UserRolesDrawerProps) {
  const form = useForm<UserRoleAssignFormValues>({
    resolver: zodResolver(userRoleAssignSchema),
    defaultValues: {
      roles: user?.roles ?? [],
    },
  });

  useEffect(() => {
    if (!open || !user) {
      return;
    }

    form.reset({
      roles: user.roles,
    });
  }, [open, user, form]);

  if (!open || !user) {
    return null;
  }

  const handleToggleRole = (role: UserRole, checked: boolean) => {
    const currentRoles = form.getValues("roles");
    if (checked) {
      if (!currentRoles.includes(role)) {
        form.setValue("roles", [...currentRoles, role], { shouldValidate: true });
      }
      return;
    }

    form.setValue(
      "roles",
      currentRoles.filter((currentRole) => currentRole !== role),
      { shouldValidate: true },
    );
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-foreground/30"
        aria-label="Fermer le panneau des roles"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-border bg-surface shadow-panel">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Assigner les roles</h2>
              <p className="text-sm text-muted-foreground">
                {user.firstName} {user.lastName} - {user.email}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form className="ds-form" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="rounded-lg border border-border/80 bg-surface-elevated p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles actuels</p>
                <div className="mt-2">
                  <UserRoleBadges roles={user.roles} />
                </div>
              </div>

              <FormField htmlFor="roles" label="Roles" required error={form.formState.errors.roles?.message}>
                <UserRoleCheckboxGroup
                  selectedRoles={form.watch("roles")}
                  onToggleRole={handleToggleRole}
                  error={form.formState.errors.roles?.message}
                />
                <p className="text-xs text-muted-foreground">
                  {form.watch("roles").length} role(s) selectionne(s).
                </p>
              </FormField>

              <div className="ds-button-group pt-2">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Mise a jour...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Assigner
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
