import { LogOut, ShieldCheck, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserRoleBadges } from "@/components/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageErrorState, PageLoadingState } from "@/components/ui/page-states";
import { useAuthContext } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { routePaths } from "@/routes/route-paths";

interface ProfileFieldProps {
  label: string;
  value: string;
}

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div className="rounded-lg border border-border/80 bg-surface-elevated px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground sm:text-base">{value}</p>
    </div>
  );
}

function toDisplayValue(value?: string | null): string {
  if (!value || value.trim().length === 0) {
    return "Non renseigne";
  }

  return value.trim();
}

export function MyProfilePage() {
  const { isProfileLoading, logout, user } = useAuthContext();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info("Session terminee. A bientot.");
    navigate(routePaths.login, { replace: true });
  };

  if (isProfileLoading) {
    return (
      <section className="ds-stack animate-fade-in-up">
        <PageLoadingState
          title="Chargement du profil..."
          description="Recuperation de vos informations depuis votre session securisee."
        />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="ds-stack animate-fade-in-up">
        <PageErrorState description="Profil utilisateur introuvable. Reconnectez-vous pour continuer." />
      </section>
    );
  }

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Mon profil</h1>
          <p>Informations du compte connecte chargees via l'authentification en cours.</p>
        </div>
        <div className="ds-button-group">
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Deconnexion
          </Button>
        </div>
      </div>

      <Card className="border-border/90 bg-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated">
              <UserCircle2 className="h-5 w-5 text-primary" />
            </span>
            {toDisplayValue(`${user.firstName ?? ""} ${user.lastName ?? ""}`)}
          </CardTitle>
          <CardDescription>Consultez les informations de votre compte utilisateur.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ProfileField label="Prenom" value={toDisplayValue(user.firstName)} />
            <ProfileField label="Nom" value={toDisplayValue(user.lastName)} />
            <ProfileField label="Email" value={toDisplayValue(user.email)} />
            <ProfileField label="Telephone" value={toDisplayValue(user.phone)} />
          </div>

          <div className="rounded-lg border border-border/80 bg-surface-elevated px-3 py-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Roles
            </p>
            <UserRoleBadges roles={user.roles} />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
