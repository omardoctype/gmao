import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LayoutSidebar } from "@/components/layout/LayoutSidebar";
import { LayoutTopbar } from "@/components/layout/LayoutTopbar";
import { useAppContext } from "@/context/app-context";
import { useAccessControl } from "@/hooks/use-access-control";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { resolveNavigationItemsByRoles } from "@/routes/navigation";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { appName } = useAppContext();
  const { hasAnyRole, roles } = useAccessControl();
  const isMobile = useMobile();
  const location = useLocation();

  const allowedNavigationItems = useMemo(() => {
    return resolveNavigationItemsByRoles(roles).filter((item) => {
      if (!item.allowedRoles || item.allowedRoles.length === 0) {
        return true;
      }

      return hasAnyRole(item.allowedRoles);
    });
  }, [hasAnyRole, roles]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen">
      <div
        className={cn(
          "mx-auto grid min-h-screen max-w-[1600px] grid-cols-1",
          sidebarCollapsed ? "lg:grid-cols-[96px_1fr]" : "lg:grid-cols-[280px_1fr]",
        )}
      >
        <LayoutSidebar
          appName={appName}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          navigationItems={allowedNavigationItems}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex min-h-screen flex-col">
          <LayoutTopbar
            sidebarCollapsed={sidebarCollapsed}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          />
          <main className="ds-page flex-1 py-6">
            <Outlet />
          </main>
        </div>
      </div>

      {mobileMenuOpen && isMobile ? (
        <button
          className="fixed inset-0 z-30 bg-foreground/30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Fermer le menu"
        />
      ) : null}
    </div>
  );
}
