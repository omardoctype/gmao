import {
  AlertTriangle,
  BellRing,
  Bot,
  Boxes,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardList,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  WrenchIcon,
} from "lucide-react";
import type { NavItem } from "@/types/navigation";
import { appRoles, routeAccessControl } from "@/routes/access-control";
import { routePaths } from "@/routes/route-paths";

export const navigationItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Vue globale des operations",
    icon: LayoutDashboard,
    to: routePaths.dashboard,
    allowedRoles: routeAccessControl.dashboard,
  },
  {
    id: "predictive-maintenance",
    label: "Maintenance predictive",
    description: "Scores risques equipements",
    icon: ChartNoAxesCombined,
    to: routePaths.predictiveMaintenance,
    allowedRoles: routeAccessControl.predictiveMaintenance,
  },
  {
    id: "ai-assistant",
    label: "Assistant IA",
    description: "Support RAG maintenance",
    icon: Bot,
    to: routePaths.aiAssistant,
    allowedRoles: routeAccessControl.aiAssistant,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alertes metier critiques",
    icon: BellRing,
    to: routePaths.notifications,
    allowedRoles: routeAccessControl.notifications,
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    description: "Trace des actions admin",
    icon: ClipboardList,
    to: routePaths.auditLogs,
    allowedRoles: routeAccessControl.auditLogs,
  },
  {
    id: "users",
    label: "Utilisateurs",
    description: "Gestion des comptes",
    icon: ShieldCheck,
    to: routePaths.users,
    allowedRoles: routeAccessControl.users,
  },
  {
    id: "equipments",
    label: "Equipements",
    description: "Parc et actifs industriels",
    icon: Settings2,
    to: routePaths.equipments,
    allowedRoles: routeAccessControl.equipments,
  },
  {
    id: "breakdowns",
    label: "Pannes",
    description: "Incidents et declarations",
    icon: AlertTriangle,
    to: routePaths.breakdowns,
    allowedRoles: routeAccessControl.breakdowns,
  },
  {
    id: "work-orders",
    label: "Ordres de travail",
    description: "Interventions et affectations",
    icon: WrenchIcon,
    to: routePaths.workOrders,
    allowedRoles: routeAccessControl.workOrders,
  },
  {
    id: "stock",
    label: "Stock / Pieces",
    description: "Pieces et mouvements",
    icon: Boxes,
    to: routePaths.stockParts,
    allowedRoles: routeAccessControl.stockParts,
  },
  {
    id: "maintenance-plans",
    label: "Plans de maintenance",
    description: "Preventif et periodicite",
    icon: CalendarClock,
    to: routePaths.maintenancePlans,
    allowedRoles: routeAccessControl.maintenancePlans,
  },
];

type NavigationItemId = string;
type NavigationRole = (typeof appRoles)[keyof typeof appRoles];

const ROLE_NAVIGATION_MATRIX: Record<NavigationRole, readonly NavigationItemId[]> = {
  ADMIN: navigationItems.map((item) => item.id),
  RESPONSABLE_MAINTENANCE: ["predictive-maintenance", "ai-assistant", "equipments", "breakdowns", "work-orders", "maintenance-plans"],
  TECHNICIAN: ["predictive-maintenance", "ai-assistant", "work-orders"],
  STOREKEEPER: ["stock"],
  OPERATOR: ["ai-assistant", "breakdowns"],
  DIRECTION: ["dashboard", "predictive-maintenance", "ai-assistant"],
};

function normalizeRole(role: string): string {
  const normalizedRole = role.trim().replaceAll(" ", "_").toUpperCase();
  return normalizedRole.startsWith("ROLE_") ? normalizedRole.slice(5) : normalizedRole;
}

export function resolveNavigationItemsByRoles(roles: readonly string[]): NavItem[] {
  const normalizedRoles = Array.from(new Set(roles.map(normalizeRole)));
  const visibleIds = new Set<NavigationItemId>();

  if (normalizedRoles.includes(appRoles.admin)) {
    navigationItems.forEach((item) => visibleIds.add(item.id as NavigationItemId));
    return navigationItems;
  }

  normalizedRoles.forEach((role) => {
    const configuredIds = ROLE_NAVIGATION_MATRIX[role as NavigationRole];
    if (!configuredIds) {
      return;
    }

    configuredIds.forEach((id) => visibleIds.add(id));
  });

  return navigationItems.filter((item) => visibleIds.has(item.id as NavigationItemId));
}

export function findNavigationItemByPath(pathname: string): NavItem | undefined {
  return navigationItems.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
}
