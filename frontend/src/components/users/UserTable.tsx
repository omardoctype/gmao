import { Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { UserRoleBadges } from "@/components/users/UserRoleBadges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserItem } from "@/types/user";

interface UserTableProps {
  users: UserItem[];
  canManage: boolean;
  deletingUserId: number | null;
  onEdit: (user: UserItem) => void;
  onAssignRoles: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
}

export function UserTable({ users, canManage, deletingUserId, onEdit, onAssignRoles, onDelete }: UserTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom complet</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead>Actif</TableHead>
          <TableHead className="sticky right-0 bg-secondary/95 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="sticky right-0 bg-surface/95">
              <p className="font-medium text-foreground">
                {user.firstName} {user.lastName}
              </p>
            </TableCell>
            <TableCell className="text-sm">{user.email}</TableCell>
            <TableCell>
              <UserRoleBadges roles={user.roles} />
            </TableCell>
            <TableCell>
              <Badge variant={user.active ? "success" : "secondary"}>{user.active ? "Oui" : "Non"}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!canManage}
                  onClick={() => onEdit(user)}
                  aria-label={`Modifier l'utilisateur ${user.email}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!canManage}
                  onClick={() => onAssignRoles(user)}
                  aria-label={`Assigner les roles de l'utilisateur ${user.email}`}
                >
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!canManage || deletingUserId === user.id}
                  onClick={() => onDelete(user)}
                  aria-label={`Supprimer l'utilisateur ${user.email}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
