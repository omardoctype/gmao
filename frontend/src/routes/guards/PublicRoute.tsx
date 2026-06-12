import { Navigate } from "react-router-dom";
import { PageLoadingState } from "@/components/ui/page-states";
import { useAuthContext } from "@/context/auth-context";
import { routePaths } from "@/routes/route-paths";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isProfileLoading } = useAuthContext();

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

  if (isAuthenticated) {
    return <Navigate to={routePaths.dashboard} replace />;
  }

  return <>{children}</>;
}
