import { PanelLeftClose, PanelLeftOpen, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayoutBreadcrumb } from "@/components/layout/LayoutBreadcrumb";
import { LayoutUserMenu } from "@/components/layout/LayoutUserMenu";
import { useAuthContext } from "@/context/auth-context";

function getTopbarDisplayName(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  return email ?? "Utilisateur";
}

interface LayoutTopbarProps {
  sidebarCollapsed: boolean;
  onOpenMobileMenu: () => void;
  onToggleCollapse: () => void;
}

export function LayoutTopbar({ sidebarCollapsed, onOpenMobileMenu, onToggleCollapse }: LayoutTopbarProps) {
  const { user } = useAuthContext();
  const displayName = getTopbarDisplayName(user?.firstName, user?.lastName, user?.email);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Button variant="outline" size="icon" className="h-11 w-11 lg:hidden" onClick={onOpenMobileMenu}>
            <Menu className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={onToggleCollapse}>
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>

          <div className="min-w-0">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">GMAO Platform</p>
            <LayoutBreadcrumb />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right lg:block">
            <p className="max-w-[240px] truncate text-xs font-medium text-foreground">{displayName}</p>
            <p className="max-w-[240px] truncate text-[11px] text-muted-foreground">
              {user?.email ?? "Profil non charge"}
            </p>
          </div>
          <LayoutUserMenu />
        </div>
      </div>
    </header>
  );
}
