import type { LucideIcon } from "lucide-react";
import type { AppRole } from "@/types/auth";

export interface NavItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  to: string;
  allowedRoles?: readonly AppRole[];
}
