import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import { AuditLogTable } from "@/components/audit-logs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FilterField, ListQueryControls } from "@/components/ui/list-query-controls";
import { PageEmptyState, PageErrorState, PageLoadingState } from "@/components/ui/page-states";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/services/api";
import { getAuditLogs } from "@/services/audit-log-service";
import type { AuditLogItem } from "@/types/audit-log";

const AUDIT_SORT_OPTIONS = [
  { value: "createdAt,desc", label: "Plus recents" },
  { value: "createdAt,asc", label: "Plus anciens" },
  { value: "action,asc", label: "Action A-Z" },
  { value: "entityType,asc", label: "EntityType A-Z" },
  { value: "username,asc", label: "Username A-Z" },
];

function toOptionalText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [actionInput, setActionInput] = useState("");
  const [entityTypeInput, setEntityTypeInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const debouncedAction = useDebouncedValue(actionInput, 350);
  const debouncedEntityType = useDebouncedValue(entityTypeInput, 350);
  const debouncedUsername = useDebouncedValue(usernameInput, 350);

  const [sort, setSort] = useState("createdAt,desc");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const resetFilters = () => {
    setActionInput("");
    setEntityTypeInput("");
    setUsernameInput("");
    setSort("createdAt,desc");
    setPage(0);
  };

  async function refreshAuditLogs(showLoader: boolean) {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const data = await getAuditLogs({
        page,
        size,
        sort,
        action: toOptionalText(debouncedAction),
        entityType: toOptionalText(debouncedEntityType),
        username: toOptionalText(debouncedUsername),
      });

      if (data.totalPages > 0 && page > data.totalPages - 1) {
        setPage(data.totalPages - 1);
        return;
      }

      setLogs(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setListError(null);
    } catch (error) {
      setListError(getApiErrorMessage(error, "Impossible de charger les logs d'audit."));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refreshAuditLogs(true);
  }, [page, size, sort, debouncedAction, debouncedEntityType, debouncedUsername]);

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Audit Logs</h1>
          <p>Consultation de la trace metier des actions critiques du systeme.</p>
        </div>
        <div className="ds-button-group">
          <Button variant="outline" onClick={() => void refreshAuditLogs(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      <ListQueryControls
        title="Filtres"
        description="Filtrage simple des logs d'audit par action, entite et utilisateur."
        sortValue={sort}
        sortOptions={AUDIT_SORT_OPTIONS}
        onSortChange={(value) => {
          setSort(value);
          setPage(0);
        }}
        actions={
          <Button variant="outline" onClick={resetFilters}>
            Reinitialiser
          </Button>
        }
      >
        <FilterField label="Action">
          <Input
            placeholder="Filtrer par action..."
            value={actionInput}
            onChange={(event) => {
              setActionInput(event.target.value);
              setPage(0);
            }}
          />
        </FilterField>
        <FilterField label="Entite">
          <Input
            placeholder="Filtrer par entityType..."
            value={entityTypeInput}
            onChange={(event) => {
              setEntityTypeInput(event.target.value);
              setPage(0);
            }}
          />
        </FilterField>
        <FilterField label="Utilisateur">
          <Input
            placeholder="Filtrer par username..."
            value={usernameInput}
            onChange={(event) => {
              setUsernameInput(event.target.value);
              setPage(0);
            }}
          />
        </FilterField>
      </ListQueryControls>

      {listError ? (
        <PageErrorState description={listError} onRetry={() => void refreshAuditLogs(true)} />
      ) : loading ? (
        <PageLoadingState title="Chargement des logs d'audit..." description="Recuperation des donnees depuis l'API." />
      ) : totalElements === 0 ? (
        <PageEmptyState
          title="Aucun log d'audit trouve"
          description="Aucune entree ne correspond aux filtres selectionnes."
          icon={ClipboardList}
        />
      ) : (
        <Card className="border-border/90 bg-surface">
          <CardHeader>
            <CardTitle>Liste des logs d'audit</CardTitle>
            <CardDescription>
              {logs.length} element(s) sur {totalElements}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AuditLogTable logs={logs} />
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
    </section>
  );
}
