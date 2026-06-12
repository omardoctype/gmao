import { useEffect, useState } from "react";
import { Plus, RefreshCw, UsersRound } from "lucide-react";
import { UserFormDrawer, UserRolesDrawer, UserTable } from "@/components/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListQueryControls } from "@/components/ui/list-query-controls";
import { PageEmptyState, PageErrorState, PageLoadingState, PageRestrictedState } from "@/components/ui/page-states";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useToast } from "@/context/toast-context";
import { useAccessControl } from "@/hooks/use-access-control";
import { userCreateSchema, userUpdateSchema, type UserRoleAssignFormValues, type UserUpdateFormValues } from "@/pages/users/user.schema";
import { getApiErrorMessage } from "@/services/api";
import { createUser, deleteUser, getUsers, updateUser, updateUserRoles } from "@/services/user-service";
import type { UserItem } from "@/types/user";

const USER_SORT_OPTIONS = [
  { value: "id,desc", label: "Plus recents" },
  { value: "id,asc", label: "Plus anciens" },
  { value: "firstName,asc", label: "Prenom A-Z" },
  { value: "lastName,asc", label: "Nom A-Z" },
  { value: "email,asc", label: "Email A-Z" },
];

function toNullableText(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toFormValues(user: UserItem): UserUpdateFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: "",
    phone: user.phone ?? "",
    active: user.active,
    roles: user.roles,
  };
}

export function UsersPage() {
  const { can, canAccessRoute } = useAccessControl();
  const toast = useToast();
  const canManage = can("userManage");
  const canRead = canAccessRoute("users");

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [sort, setSort] = useState("id,desc");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [submittingForm, setSubmittingForm] = useState(false);

  const [rolesDrawerOpen, setRolesDrawerOpen] = useState(false);
  const [rolesTargetUser, setRolesTargetUser] = useState<UserItem | null>(null);
  const [assigningRoles, setAssigningRoles] = useState(false);

  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const resetFilters = () => {
    setSort("id,desc");
    setPage(0);
  };

  async function refreshUsers(showLoader: boolean) {
    if (!canRead) {
      setUsers([]);
      setTotalElements(0);
      setTotalPages(0);
      setListError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await getUsers({
        page,
        size,
        sort,
      });

      if (data.totalPages > 0 && page > data.totalPages - 1) {
        setPage(data.totalPages - 1);
        return;
      }

      setUsers(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setListError(null);
    } catch (error) {
      setListError(getApiErrorMessage(error, "Impossible de charger les utilisateurs."));
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    void refreshUsers(true);
  }, [canRead, page, size, sort]);

  const openCreateDrawer = () => {
    setFormMode("create");
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEditDrawer = (user: UserItem) => {
    setFormMode("edit");
    setEditingUser(user);
    setFormOpen(true);
  };

  const openRolesDrawer = (user: UserItem) => {
    setRolesTargetUser(user);
    setRolesDrawerOpen(true);
  };

  const handleFormSubmit = async (values: UserUpdateFormValues) => {
    setSubmittingForm(true);

    try {
      if (formMode === "create") {
        const parsedCreate = userCreateSchema.parse(values);
        await createUser({
          firstName: parsedCreate.firstName.trim(),
          lastName: parsedCreate.lastName.trim(),
          email: parsedCreate.email.trim(),
          password: parsedCreate.password.trim(),
          phone: toNullableText(parsedCreate.phone),
          active: parsedCreate.active,
          roles: parsedCreate.roles,
        });
        toast.success("Utilisateur cree avec succes.");
      } else if (editingUser) {
        const parsedUpdate = userUpdateSchema.parse(values);
        await updateUser(editingUser.id, {
          firstName: parsedUpdate.firstName.trim(),
          lastName: parsedUpdate.lastName.trim(),
          email: parsedUpdate.email.trim(),
          password: toNullableText(parsedUpdate.password),
          phone: toNullableText(parsedUpdate.phone),
          active: parsedUpdate.active,
          roles: parsedUpdate.roles,
        });
        toast.success("Utilisateur mis a jour avec succes.");
      }

      setFormOpen(false);
      await refreshUsers(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Operation impossible sur l'utilisateur."));
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleAssignRoles = async (values: UserRoleAssignFormValues) => {
    if (!rolesTargetUser) {
      return;
    }

    setAssigningRoles(true);

    try {
      await updateUserRoles(rolesTargetUser.id, {
        roles: values.roles,
      });
      toast.success("Roles mis a jour avec succes.");
      setRolesDrawerOpen(false);
      await refreshUsers(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de mettre a jour les roles."));
    } finally {
      setAssigningRoles(false);
    }
  };

  const handleDelete = async (user: UserItem) => {
    if (!canManage) {
      return;
    }

    const confirmed = window.confirm(`Confirmer la suppression de ${user.firstName} ${user.lastName} ?`);
    if (!confirmed) {
      return;
    }

    setDeletingUserId(user.id);

    try {
      await deleteUser(user.id);
      toast.success("Utilisateur supprime avec succes.");
      await refreshUsers(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Suppression impossible pour cet utilisateur."));
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Utilisateurs</h1>
          <p>Gestion admin des comptes, statuts et roles d'acces.</p>
        </div>
        <div className="ds-button-group">
          <Button
            variant="outline"
            disabled={loading || refreshing}
            onClick={() => void refreshUsers(false)}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </Button>
          {canManage ? (
            <Button onClick={openCreateDrawer}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Button>
          ) : null}
        </div>
      </div>

      <ListQueryControls
        title="Filtres"
        description="Tri et organisation de la liste des utilisateurs."
        columns={3}
        sortValue={sort}
        sortOptions={USER_SORT_OPTIONS}
        onSortChange={(value) => {
          setSort(value);
          setPage(0);
        }}
        actions={
          <Button variant="outline" onClick={resetFilters}>
            Reinitialiser
          </Button>
        }
      />

      {!canRead ? (
        <PageRestrictedState
          title="Acces reserve"
          description="Cette page est accessible uniquement au role ADMIN."
          icon={UsersRound}
        />
      ) : listError ? (
        <PageErrorState description={listError} onRetry={() => void refreshUsers(true)} />
      ) : loading ? (
        <PageLoadingState
          title="Chargement des utilisateurs..."
          description="Recuperation des comptes utilisateurs depuis l'API."
        />
      ) : totalElements === 0 ? (
        <PageEmptyState
          title="Aucun utilisateur trouve"
          description="Commencez par creer un premier compte utilisateur."
          icon={UsersRound}
          action={canManage ? { label: "Creer un utilisateur", onClick: openCreateDrawer } : undefined}
        />
      ) : (
        <Card className="border-border/90 bg-surface">
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>
              {users.length} element(s) sur {totalElements}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UserTable
              users={users}
              canManage={canManage}
              deletingUserId={deletingUserId}
              onEdit={openEditDrawer}
              onAssignRoles={openRolesDrawer}
              onDelete={(user) => {
                void handleDelete(user);
              }}
            />
            <PaginationControls
              page={page}
              size={size}
              totalElements={totalElements}
              totalPages={totalPages}
              onPageChange={setPage}
              onSizeChange={(nextSize) => {
                setSize(nextSize);
                setPage(0);
              }}
            />
          </CardContent>
        </Card>
      )}

      <UserFormDrawer
        open={formOpen}
        mode={formMode}
        submitting={submittingForm}
        initialValues={editingUser ? toFormValues(editingUser) : undefined}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <UserRolesDrawer
        open={rolesDrawerOpen}
        user={rolesTargetUser}
        submitting={assigningRoles}
        onClose={() => setRolesDrawerOpen(false)}
        onSubmit={handleAssignRoles}
      />
    </section>
  );
}
