import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { findNavigationItemByPath } from "@/routes/navigation";
import { routePaths } from "@/routes/route-paths";

export function LayoutBreadcrumb() {
  const { pathname } = useLocation();
  const currentItem = findNavigationItemByPath(pathname);
  const isDashboard = !currentItem || currentItem.to === routePaths.dashboard;

  return (
    <nav aria-label="Fil d'ariane" className="hidden md:block">
      <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <li>
          <Link to={routePaths.dashboard} className="inline-flex items-center gap-1 rounded-sm hover:text-foreground">
            <Home className="h-3.5 w-3.5" />
            <span>Accueil</span>
          </Link>
        </li>

        {!isDashboard && currentItem ? (
          <>
            <li>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="font-semibold text-foreground">{currentItem.label}</li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
