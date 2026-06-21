import { useEffect, useState } from "react";
import { Plus, RefreshCw, Siren } from "lucide-react";
import {
  BreakdownAiDiagnosisDrawer,
  BreakdownDetailsDrawer,
  BreakdownFormDrawer,
  BreakdownPriorityBadge,
  BreakdownStatusDrawer,
  BreakdownTable,
} from "@/components/breakdowns";
import { ExportCsvButton } from "@/components/exports";
import type { BreakdownEquipmentOption } from "@/components/breakdowns/BreakdownFormDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterField, ListQueryControls } from "@/components/ui/list-query-controls";
import { PageEmptyState, PageErrorState, PageLoadingState, PageRestrictedState } from "@/components/ui/page-states";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/toast-context";
import { useAccessControl } from "@/hooks/use-access-control";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { type BreakdownFormValues, type BreakdownStatusFormValues } from "@/pages/breakdowns/breakdown.schema";
import { getApiErrorMessage } from "@/services/api";
import { uploadAttachments } from "@/services/attachment-service";
import {
  createBreakdown,
  getBreakdownById,
  getBreakdowns,
  updateBreakdown,
  updateBreakdownStatus,
} from "@/services/breakdown-service";
import { getEquipmentOptions } from "@/services/equipment-service";
import { downloadBreakdownsCsv } from "@/services/export-service";
import type { Breakdown, BreakdownPayload, BreakdownPriority, BreakdownStatus, BreakdownType } from "@/types/breakdown";

const BREAKDOWN_SORT_OPTIONS = [
  { value: "declaredAt,desc", label: "Plus recentes" },
  { value: "declaredAt,asc", label: "Plus anciennes" },
  { value: "priority,desc", label: "Priorite critique d'abord" },
  { value: "status,asc", label: "Statut" },
  { value: "reference,asc", label: "Reference A-Z" },
];

type StatusFilter = "ALL" | BreakdownStatus;
type PriorityFilter = "ALL" | BreakdownPriority;
type TypeFilter = "ALL" | BreakdownType;

function toOptionalText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toBreakdownPayload(values: BreakdownFormValues): BreakdownPayload {
  return {
    reference: values.reference.trim(),
    title: values.title.trim(),
    description: values.description.trim(),
    type: values.type,
    priority: values.priority,
    status: values.status,
    equipmentId: values.equipmentId,
  };
}

function toBreakdownFormValues(breakdown: Breakdown): BreakdownFormValues {
  return {
    reference: breakdown.reference,
    title: breakdown.title,
    description: breakdown.description,
    type: breakdown.type,
    priority: breakdown.priority,
    status: breakdown.status,
    equipmentId: breakdown.equipmentId,
  };
}

export function BreakdownsPage() {
  const { can } = useAccessControl();
  const toast = useToast();
  const canRead = can("breakdownRead");
  const canDeclare = can("breakdownDeclare");
  const canManage = can("breakdownManage");
  const canAiDiagnosis = can("aiAssistantDiagnosis");
  const canExport = can("exportCsv");

  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<BreakdownEquipmentOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [sort, setSort] = useState("declaredAt,desc");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingBreakdownId, setEditingBreakdownId] = useState<number | null>(null);
  const [formInitialValues, setFormInitialValues] = useState<BreakdownFormValues | undefined>(undefined);
  const [loadingInitialFormData, setLoadingInitialFormData] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);

  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false);
  const [statusTargetBreakdownId, setStatusTargetBreakdownId] = useState<number | null>(null);
  const [statusInitialValue, setStatusInitialValue] = useState<BreakdownStatus | null>(null);
  const [updatingStatusBreakdownId, setUpdatingStatusBreakdownId] = useState<number | null>(null);
  const [aiDiagnosisOpen, setAiDiagnosisOpen] = useState(false);
  const [aiTargetBreakdown, setAiTargetBreakdown] = useState<Breakdown | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  const resetFilters = () => {
    setSearchInput("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setTypeFilter("ALL");
    setSort("declaredAt,desc");
    setPage(0);
  };

  async function loadEquipmentOptions() {
    try {
      const equipments = await getEquipmentOptions();
      setEquipmentOptions(
        equipments.map((equipment) => ({
          id: equipment.id,
          code: equipment.code,
          name: equipment.name,
        })),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de charger la liste des equipements."));
    }
  }

  async function refreshBreakdowns(showLoader: boolean) {
    if (!canRead) {
      setBreakdowns([]);
      setTotalElements(0);
      setTotalPages(0);
      setListError(null);
      setLoading(false);
      return;
    }

    if (showLoader) {
      setLoading(true);
    }

    try {
      const data = await getBreakdowns({
        page,
        size,
        sort,
        search: toOptionalText(debouncedSearch),
        status: statusFilter === "ALL" ? undefined : statusFilter,
        priority: priorityFilter === "ALL" ? undefined : priorityFilter,
        type: typeFilter === "ALL" ? undefined : typeFilter,
      });

      if (data.totalPages > 0 && page > data.totalPages - 1) {
        setPage(data.totalPages - 1);
        return;
      }

      setBreakdowns(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setListError(null);
    } catch (error) {
      setListError(getApiErrorMessage(error, "Impossible de charger les pannes."));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refreshBreakdowns(true);
  }, [canRead, page, size, sort, debouncedSearch, statusFilter, priorityFilter, typeFilter]);

  useEffect(() => {
    if (canDeclare || canManage) {
      void loadEquipmentOptions();
    }
  }, [canDeclare, canManage]);

  const openCreateDrawer = () => {
    setFormMode("create");
    setEditingBreakdownId(null);
    setFormInitialValues(undefined);
    setLoadingInitialFormData(false);
    setFormOpen(true);
  };

  const openEditDrawer = async (breakdown: Breakdown) => {
    setFormMode("edit");
    setEditingBreakdownId(breakdown.id);
    setFormInitialValues(undefined);
    setLoadingInitialFormData(true);
    setFormOpen(true);

    try {
      const freshBreakdown = await getBreakdownById(breakdown.id);
      setFormInitialValues(toBreakdownFormValues(freshBreakdown));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de charger le detail de la panne."));
      setFormOpen(false);
    } finally {
      setLoadingInitialFormData(false);
    }
  };

  const openDetailsDrawer = async (breakdown: Breakdown) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setSelectedBreakdown(null);

    try {
      const freshBreakdown = await getBreakdownById(breakdown.id);
      setSelectedBreakdown(freshBreakdown);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de charger le detail de la panne."));
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openStatusDrawer = (breakdown: Breakdown) => {
    setStatusTargetBreakdownId(breakdown.id);
    setStatusInitialValue(breakdown.status);
    setStatusDrawerOpen(true);
  };

  const openAiDiagnosisDrawer = (breakdown: Breakdown) => {
    if (!canAiDiagnosis) {
      return;
    }
    setAiTargetBreakdown(breakdown);
    setAiDiagnosisOpen(true);
  };

  const handleFormSubmit = async (values: BreakdownFormValues, photoFiles: File[]) => {
    const payload = toBreakdownPayload(values);
    setSubmittingForm(true);

    try {
      if (formMode === "create") {
        const createdBreakdown = await createBreakdown({
          ...payload,
          status: "DECLARED",
        });
        if (photoFiles.length > 0) {
          try {
            await uploadAttachments({
              entityType: "BREAKDOWN",
              entityId: createdBreakdown.id,
              category: "BREAKDOWN_PHOTO",
              files: photoFiles,
            });
            toast.success("Panne declaree avec photos.");
          } catch (attachmentError) {
            toast.error(getApiErrorMessage(attachmentError, "Panne declaree, mais les photos n'ont pas pu etre ajoutees."));
          }
        } else {
          toast.success("Panne declaree avec succes.");
        }
      } else if (editingBreakdownId) {
        const updatedBreakdown = await updateBreakdown(editingBreakdownId, payload);
        if (photoFiles.length > 0) {
          try {
            await uploadAttachments({
              entityType: "BREAKDOWN",
              entityId: updatedBreakdown.id,
              category: "BREAKDOWN_PHOTO",
              files: photoFiles,
            });
            toast.success("Panne mise a jour avec photos.");
          } catch (attachmentError) {
            toast.error(getApiErrorMessage(attachmentError, "Panne mise a jour, mais les photos n'ont pas pu etre ajoutees."));
          }
        } else {
          toast.success("Panne mise a jour avec succes.");
        }
      }

      setFormOpen(false);
      await refreshBreakdowns(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Operation impossible sur la panne."));
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleStatusUpdate = async (values: BreakdownStatusFormValues) => {
    if (!statusTargetBreakdownId) {
      return;
    }

    setUpdatingStatusBreakdownId(statusTargetBreakdownId);

    try {
      await updateBreakdownStatus(statusTargetBreakdownId, { status: values.status });
      toast.success("Statut de la panne mis a jour avec succes.");
      setStatusDrawerOpen(false);
      await refreshBreakdowns(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Mise a jour du statut impossible."));
    } finally {
      setUpdatingStatusBreakdownId(null);
    }
  };

  const handleExportCsv = async () => {
    if (!canExport) {
      return;
    }

    setExportingCsv(true);

    try {
      await downloadBreakdownsCsv();
      toast.success("Export CSV des pannes telecharge.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible d'exporter les pannes en CSV."));
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Pannes</h1>
          <p>Declaration, qualification et suivi des incidents de maintenance industrielle.</p>
        </div>
        <div className="ds-button-group">
          <Button variant="outline" onClick={() => void refreshBreakdowns(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          {canExport ? <ExportCsvButton loading={exportingCsv} onClick={() => void handleExportCsv()} /> : null}
          {canDeclare ? (
            <Button onClick={openCreateDrawer}>
              <Plus className="mr-2 h-4 w-4" />
              Declarer une panne
            </Button>
          ) : null}
        </div>
      </div>

      <ListQueryControls
        title="Filtres"
        description="Recherche, tri et filtrage serveur des pannes."
        searchValue={searchInput}
        searchPlaceholder="Rechercher reference, titre, description..."
        onSearchChange={(value) => {
          setSearchInput(value);
          setPage(0);
        }}
        sortValue={sort}
        sortOptions={BREAKDOWN_SORT_OPTIONS}
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
        <FilterField label="Statut">
          <Select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(0);
            }}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="DECLARED">Declaree</option>
            <option value="QUALIFIED">Qualifiee</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="RESOLVED">Resolue</option>
          </Select>
        </FilterField>
        <FilterField label="Priorite">
          <Select
            value={priorityFilter}
            onChange={(event) => {
              setPriorityFilter(event.target.value as PriorityFilter);
              setPage(0);
            }}
          >
            <option value="ALL">Toutes les priorites</option>
            <option value="LOW">Faible</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </Select>
        </FilterField>
        <FilterField label="Type">
          <Select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as TypeFilter);
              setPage(0);
            }}
          >
            <option value="ALL">Tous les types</option>
            <option value="MECHANICAL">Mecanique</option>
            <option value="ELECTRICAL">Electrique</option>
            <option value="HYDRAULIC">Hydraulique</option>
            <option value="PNEUMATIC">Pneumatique</option>
            <option value="SOFTWARE">Logiciel</option>
            <option value="OTHER">Autre</option>
          </Select>
        </FilterField>
      </ListQueryControls>

      {!canRead ? (
        <PageRestrictedState
          description="Votre role ne permet pas de consulter la liste complete des pannes. Vous pouvez toutefois declarer une panne si autorise."
          icon={Siren}
        />
      ) : listError ? (
        <PageErrorState description={listError} onRetry={() => void refreshBreakdowns(true)} />
      ) : loading ? (
        <PageLoadingState title="Chargement des pannes..." description="Recuperation des donnees depuis l'API." />
      ) : totalElements === 0 ? (
        <PageEmptyState
          title="Aucune panne trouvee"
          description="Aucune donnee ne correspond aux filtres selectionnes, ou aucune panne n'est encore enregistree."
        />
      ) : (
        <Card className="border-border/90 bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Liste des pannes
              <BreakdownPriorityBadge priority="CRITICAL" />
            </CardTitle>
            <CardDescription>
              {breakdowns.length} element(s) sur {totalElements}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BreakdownTable
              breakdowns={breakdowns}
              canManage={canManage}
              canAiDiagnosis={canAiDiagnosis}
              updatingStatusBreakdownId={updatingStatusBreakdownId}
              onView={(breakdown) => {
                void openDetailsDrawer(breakdown);
              }}
              onAiDiagnosis={openAiDiagnosisDrawer}
              onEdit={(breakdown) => {
                void openEditDrawer(breakdown);
              }}
              onStatusChange={openStatusDrawer}
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

      <BreakdownFormDrawer
        open={formOpen}
        mode={formMode}
        loadingInitialData={loadingInitialFormData}
        submitting={submittingForm}
        initialValues={formInitialValues}
        equipmentOptions={equipmentOptions}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <BreakdownDetailsDrawer
        open={detailsOpen}
        loading={detailsLoading}
        breakdown={selectedBreakdown}
        canAiDiagnosis={canAiDiagnosis}
        onAiDiagnosis={openAiDiagnosisDrawer}
        onClose={() => setDetailsOpen(false)}
      />

      <BreakdownStatusDrawer
        open={statusDrawerOpen}
        loading={updatingStatusBreakdownId !== null}
        initialStatus={statusInitialValue}
        onClose={() => setStatusDrawerOpen(false)}
        onSubmit={handleStatusUpdate}
      />

      <BreakdownAiDiagnosisDrawer
        open={aiDiagnosisOpen}
        breakdown={aiTargetBreakdown}
        onClose={() => {
          setAiDiagnosisOpen(false);
          setAiTargetBreakdown(null);
        }}
      />
    </section>
  );
}
