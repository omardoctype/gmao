import type { UserRole } from "@/types/user";

export const USER_ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "ADMIN", label: "Admin" },
  { value: "RESPONSABLE_MAINTENANCE", label: "Responsable maintenance" },
  { value: "TECHNICIAN", label: "Technicien" },
  { value: "STOREKEEPER", label: "Magasinier" },
  { value: "OPERATOR", label: "Operateur" },
  { value: "DIRECTION", label: "Direction" },
];

function formatUnknownRole(role: string): string {
  return role
    .replace(/^ROLE_/i, "")
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function formatRoleLabel(role: string): string {
  return USER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? formatUnknownRole(role);
}
