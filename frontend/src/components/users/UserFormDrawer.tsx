import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { UserRoleCheckboxGroup } from "@/components/users/UserRoleCheckboxGroup";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ResponsiveCrudPanel } from "@/components/ui/responsive-crud-panel";
import { userUpdateSchema, type UserUpdateFormValues } from "@/pages/users/user.schema";
import type { UserRole } from "@/types/user";

const DEFAULT_FORM_VALUES: UserUpdateFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  active: true,
  roles: ["OPERATOR"],
};

interface UserFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  submitting: boolean;
  initialValues?: UserUpdateFormValues;
  onClose: () => void;
  onSubmit: (values: UserUpdateFormValues) => Promise<void>;
}

export function UserFormDrawer({ open, mode, submitting, initialValues, onClose, onSubmit }: UserFormDrawerProps) {
  const form = useForm<UserUpdateFormValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialValues) {
      form.reset(initialValues);
      return;
    }

    form.reset(DEFAULT_FORM_VALUES);
  }, [open, initialValues, form]);

  if (!open) {
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

  const handleSubmit = form.handleSubmit(async (values) => {
    if (mode === "create" && !values.password?.trim()) {
      form.setError("password", { type: "manual", message: "Le mot de passe est obligatoire." });
      return;
    }

    await onSubmit(values);
  });
  const formId = "user-crud-form";

  return (
    <ResponsiveCrudPanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer le formulaire utilisateur"
      title={mode === "create" ? "Creer un utilisateur" : "Modifier utilisateur"}
      description={
        mode === "create"
          ? "Ajoute un nouveau compte utilisateur avec ses roles."
          : "Mets a jour les informations et droits de l'utilisateur."
      }
      maxWidthClassName="md:max-w-3xl lg:max-w-4xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form={formId} className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                {mode === "create" ? "Creer" : "Mettre a jour"}
              </>
            )}
          </Button>
        </div>
      }
    >
      <form id={formId} className="ds-form" onSubmit={handleSubmit}>
        <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
          <FormField
            htmlFor="firstName"
            label="Prenom"
            required
            error={form.formState.errors.firstName?.message}
          >
            <Input id="firstName" placeholder="Meriem" {...form.register("firstName")} />
          </FormField>
          <FormField htmlFor="lastName" label="Nom" required error={form.formState.errors.lastName?.message}>
            <Input id="lastName" placeholder="Khaled" {...form.register("lastName")} />
          </FormField>
        </div>

        <FormField htmlFor="email" label="Email" required error={form.formState.errors.email?.message}>
          <Input id="email" type="email" placeholder="meriem.khaled@gmao.com" {...form.register("email")} />
        </FormField>

        <div className="ds-form-grid lg:grid-cols-2 lg:gap-6">
          <FormField
            htmlFor="password"
            label={mode === "create" ? "Mot de passe" : "Nouveau mot de passe"}
            required={mode === "create"}
            hint={mode === "edit" ? "Laisse vide pour conserver le mot de passe actuel." : undefined}
            error={form.formState.errors.password?.message}
          >
            <Input id="password" type="password" placeholder="********" {...form.register("password")} />
          </FormField>
          <FormField htmlFor="phone" label="Telephone" error={form.formState.errors.phone?.message}>
            <Input id="phone" placeholder="+21620123456" {...form.register("phone")} />
          </FormField>
        </div>

        <FormField htmlFor="roles" label="Roles" required error={form.formState.errors.roles?.message}>
          <UserRoleCheckboxGroup
            selectedRoles={form.watch("roles")}
            onToggleRole={handleToggleRole}
            error={form.formState.errors.roles?.message}
          />
        </FormField>

        <label className="flex items-center gap-2 rounded-md border border-border/70 bg-surface-elevated px-3 py-2">
          <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" {...form.register("active")} />
          <span className="text-sm text-foreground">Compte actif</span>
        </label>
      </form>
    </ResponsiveCrudPanel>
  );
}
