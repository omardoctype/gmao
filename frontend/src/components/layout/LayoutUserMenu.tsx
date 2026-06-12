import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LayoutNotificationsPanel } from "@/components/layout/LayoutNotificationsPanel";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { cn } from "@/lib/utils";
import { routePaths } from "@/routes/route-paths";

function formatRoleLabel(role?: string): string {
  if (!role) {
    return "Aucun role";
  }

  return role
    .replace(/^ROLE_/i, "")
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function getUserInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "US";
}

function getDisplayName(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  return email ?? "Utilisateur";
}

export function LayoutUserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { logout, user } = useAuthContext();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    toast.info("Session terminee. A bientot.");
    navigate(routePaths.login, { replace: true });
  };

  const handleGoToProfile = () => {
    setOpen(false);
    navigate(routePaths.myProfile);
  };

  const displayName = getDisplayName(user?.firstName, user?.lastName, user?.email);
  const primaryRole = formatRoleLabel(user?.roles[0]);
  const rolesLabel = user?.roles.length ? user.roles.map((role) => formatRoleLabel(role)).join(" | ") : "Aucun role";
  const userInitials = getUserInitials(user?.firstName, user?.lastName, user?.email);

  return (
    <div className="flex items-center gap-2">
      <LayoutNotificationsPanel />

      <div className="relative" ref={menuRef}>
        <Button variant="outline" size="sm" className="h-11 gap-2 px-2.5" onClick={() => setOpen((prev) => !prev)}>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {userInitials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-semibold text-foreground">{displayName}</span>
            <span className="block text-[11px] text-muted-foreground">{primaryRole}</span>
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </Button>

        {open ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-56 rounded-lg border bg-card p-2 shadow-panel">
            <div className="mb-1 rounded-md border border-border/80 bg-surface-elevated px-3 py-2">
              <p className="truncate text-xs font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.email ?? "Email non renseigne"}</p>
              <p className="truncate text-[11px] text-muted-foreground">{rolesLabel}</p>
            </div>
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted/60"
              onClick={handleGoToProfile}
            >
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
              Mon profil
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Deconnexion
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
