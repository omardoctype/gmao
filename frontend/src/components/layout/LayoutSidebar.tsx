import { Factory, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/navigation";

interface LayoutSidebarProps {
  appName: string;
  collapsed: boolean;
  mobileOpen: boolean;
  navigationItems: NavItem[];
  onCloseMobile: () => void;
}

export function LayoutSidebar({
  appName,
  collapsed,
  mobileOpen,
  navigationItems,
  onCloseMobile,
}: LayoutSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 border-r border-border/80 bg-sidebar/95 p-4 text-sidebar-foreground shadow-panel backdrop-blur transition-transform duration-300 lg:relative lg:w-auto lg:translate-x-0 lg:shadow-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-full flex-col gap-6">
        <div className={cn("flex items-center justify-between border-b border-border pb-4", collapsed && "lg:justify-center")}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl border border-border bg-surface-elevated p-2">
              <Factory className="h-5 w-5 text-primary" />
            </div>
            <div className={cn("min-w-0", collapsed && "lg:hidden")}>
              <p className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Industrial</p>
              <p className="truncate font-display text-lg font-semibold text-foreground">{appName}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onCloseMobile}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              title={collapsed ? item.label : undefined}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  "group flex items-start gap-3 rounded-lg border px-3 py-3 transition",
                  collapsed && "lg:justify-center lg:px-2",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-transparent hover:border-border hover:bg-surface-muted/70",
                )
              }
            >
              <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className={cn("min-w-0", collapsed && "lg:hidden")}>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">{item.description}</p>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className={cn("mt-auto rounded-lg border border-border bg-secondary/40 p-4", collapsed && "lg:hidden")}>
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">Demo Mode</p>
          <p className="mt-1 text-xs text-muted-foreground">Structure prete pour connecter les modules sans mock backend.</p>
        </div>
      </div>
    </aside>
  );
}
