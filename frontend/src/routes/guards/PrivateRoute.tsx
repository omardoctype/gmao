import { Navigate, useLocation } from "react-router-dom";
import { PageLoadingState } from "@/components/ui/page-states";
import { useAuthContext } from "@/context/auth-context";
import { routePaths } from "@/routes/route-paths";
import type { AppRole } from "@/types/auth";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: readonly AppRole[];
}

export function PrivateRoute({ children, allowedRoles = [] }: PrivateRouteProps) {
  const { hasAnyRole, isAuthenticated, isProfileLoading } = useAuthContext();
  const location = useLocation();

  if (isProfileLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
        <PageLoadingState
          title="Chargement du profil..."
          description="Verification de votre session securisee en cours."
        />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={routePaths.login} replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return <Navigate to={routePaths.dashboard} replace />;
  }

  return <>{children}</>;
}
