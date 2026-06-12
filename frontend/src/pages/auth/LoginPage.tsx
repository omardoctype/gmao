import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/auth-context";
import { type LoginFormValues, loginSchema } from "@/pages/auth/login.schema";
import { routePaths } from "@/routes/route-paths";
import { ApiHttpError } from "@/services/api";

interface LoginLocationState {
  from?: {
    pathname?: string;
  };
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuthContext();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LoginLocationState | null;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@gmao.com",
      password: "Admin123!",
    },
  });

  if (isAuthenticated) {
    return <Navigate to={routePaths.dashboard} replace />;
  }

  const redirectPath =
    state?.from?.pathname && state.from.pathname !== routePaths.login ? state.from.pathname : routePaths.dashboard;

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    form.clearErrors();

    try {
      await login(values);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      if (error instanceof ApiHttpError) {
        const emailError = error.details?.email;
        const passwordError = error.details?.password;

        if (emailError) {
          form.setError("email", { type: "server", message: emailError });
        }
        if (passwordError) {
          form.setError("password", { type: "server", message: passwordError });
        }

        setSubmitError(error.message);
        return;
      }

      if (error instanceof Error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError("Login impossible. Verifiez vos identifiants.");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(9,66,112,0.12),transparent_40%),radial-gradient(circle_at_82%_18%,rgba(17,116,140,0.11),transparent_38%)]" />

      <Card className="relative z-10 w-full max-w-md border-border/90 bg-surface shadow-panel">
        <CardHeader>
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-elevated">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connexion GMAO</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>

        <CardContent>
          <form className="ds-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              htmlFor="email"
              label="Email"
              required
              error={form.formState.errors.email?.message}
              hint="Adresse professionnelle"
            >
              <Input
                id="email"
                type="email"
                placeholder="admin@gmao.com"
                autoComplete="email"
                {...form.register("email")}
              />
            </FormField>

            <FormField
              htmlFor="password"
              label="Mot de passe"
              required
              error={form.formState.errors.password?.message}
              hint="Minimum 6 caracteres"
            >
              <Input
                id="password"
                type="password"
                placeholder="********"
                autoComplete="current-password"
                {...form.register("password")}
              />
            </FormField>

            {submitError ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              <LockKeyhole className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
