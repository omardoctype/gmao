import { Badge } from "@/components/ui/badge";
import { formatRoleLabel } from "@/components/users/user-roles";

interface UserRoleBadgesProps {
  roles: readonly string[];
  emptyLabel?: string;
}

export function UserRoleBadges({ roles, emptyLabel = "Aucun role" }: UserRoleBadgesProps) {
  if (roles.length === 0) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role, index) => (
        <Badge key={`${role}-${index}`} variant="outline">
          {formatRoleLabel(role)}
        </Badge>
      ))}
    </div>
  );
}
