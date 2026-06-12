import { useEffect, useState } from "react";
import { Plus, RefreshCw, Wrench } from "lucide-react";
import { EquipmentDetailsDrawer, EquipmentFormDrawer, EquipmentTable } from "@/components/equipments";
import { ExportCsvButton } from "@/components/exports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FilterField, ListQueryControls } from "@/components/ui/list-query-controls";
import { PageEmptyState, PageErrorState, PageLoadingState } from "@/components/ui/page-states";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/toast-context";
import { useAccessControl } from "@/hooks/use-access-control";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { type EquipmentFormValues } from "@/pages/equipments/equipment.schema";
import { getApiErrorMessage } from "@/services/api";
import { createEquipment, deleteEquipment, getEquipmentById, getEquipments, updateEquipment } from "@/services/equipment-service";
import { downloadEquipmentsCsv } from "@/services/export-service";
import type { Equipment, EquipmentPayload } from "@/types/equipment";

const EQUIPMENT_SORT_OPTIONS = [
  { value: "id,desc", label: "Plus recents" },
  { value: "name,asc", label: "Nom A-Z" },
  { value: "name,desc", label: "Nom Z-A" },
  { value: "category,asc", label: "Categorie A-Z" },
  { value: "status,asc", label: "Statut" },
  { value: "criticality,desc", label: "Criticite" },
];

type StatusFilter = "ALL" | Equipment["status"];
type CriticalityFilter = "ALL" | Equipment["criticality"];

function toNullableText(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toOptionalText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toEquipmentPayload(values: EquipmentFormValues): EquipmentPayload {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    category: values.category.trim(),
    brand: toNullableText(values.brand),
    model: toNullableText(values.model),
    serialNumber: toNullableText(values.serialNumber),
    location: toNullableText(values.location),
    status: values.status,
    criticality: values.criticality,
    installationDate: toNullableText(values.installationDate),
    description: toNullableText(values.description),
  };
}

function toEquipmentFormValues(equipment: Equipment): EquipmentFormValues {
  return {
    code: equipment.code,
    name: equipment.name,
    category: equipment.category,
    brand: equipment.brand ?? "",
    model: equipment.model ?? "",
    serialNumber: equipment.serialNumber ?? "",
    location: equipment.location ?? "",
    status: equipment.status,
    criticality: equipment.criticality,
    installationDate: equipment.installationDate ?? "",
    description: equipment.description ?? "",
  };
}

export function EquipmentsPage() {
  const { can } = useAccessControl();
  const toast = useToast();
  const canManage = can("equipmentManage");
  const canExport = can("exportCsv");

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [criticalityFilter, setCriticalityFilter] = useState<CriticalityFilter>("ALL");
  const [sort, setSort] = useState("id,desc");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null);
  const [formInitialValues, setFormInitialValues] = useState<EquipmentFormValues | undefined>(undefined);
  const [loadingInitialFormData, setLoadingInitialFormData] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const [deletingEquipmentId, setDeletingEquipmentId] = useState<number | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  const resetFilters = () => {
    setSearchInput("");
    setNameFilter("");
    setCategoryFilter("");
    setStatusFilter("ALL");
    setCriticalityFilter("ALL");
    setSort("id,desc");
    setPage(0);
  };

  async function refreshEquipments(showLoader: boolean) {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const data = await getEquipments({
        page,
        size,
        sort,
        search: toOptionalText(debouncedSearch),
        name: toOptionalText(nameFilter),
        category: toOptionalText(categoryFilter),
        status: statusFilter === "ALL" ? undefined : statusFilter,
        criticality: criticalityFilter === "ALL" ? undefined : criticalityFilter,
      });

      if (data.totalPages > 0 && page > data.totalPages - 1) {
        setPage(data.totalPages - 1);
        return;
      }

      setEquipments(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setListError(null);
    } catch (error) {
      setListError(getApiErrorMessage(error, "Impossible de charger les equipements."));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refreshEquipments(true);
  }, [page, size, sort, debouncedSearch, nameFilter, categoryFilter, statusFilter, criticalityFilter]);

  const openCreateDrawer = () => {
    setFormMode("create");
    setEditingEquipmentId(null);
    setFormInitialValues(undefined);
    setLoadingInitialFormData(false);
    setFormOpen(true);
  };

  const openEditDrawer = async (equipment: Equipment) => {
    setFormMode("edit");
    setEditingEquipmentId(equipment.id);
    setFormInitialValues(undefined);
    setLoadingInitialFormData(true);
    setFormOpen(true);

    try {
      const freshEquipment = await getEquipmentById(equipment.id);
      setFormInitialValues(toEquipmentFormValues(freshEquipment));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de charger le detail equipement."));
      setFormOpen(false);
    } finally {
      setLoadingInitialFormData(false);
    }
  };

  const openDetailsDrawer = async (equipment: Equipment) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setSelectedEquipment(null);

    try {
      const freshEquipment = await getEquipmentById(equipment.id);
      setSelectedEquipment(freshEquipment);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de charger le detail equipement."));
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleFormSubmit = async (values: EquipmentFormValues) => {
    const payload = toEquipmentPayload(values);
    setSubmittingForm(true);

    try {
      if (formMode === "create") {
        await createEquipment(payload);
        toast.success("Equipement cree avec succes.");
      } else if (editingEquipmentId) {
        await updateEquipment(editingEquipmentId, payload);
        toast.success("Equipement mis a jour avec succes.");
      }

      setFormOpen(false);
      await refreshEquipments(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Operation impossible sur l'equipement."));
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDelete = async (equipment: Equipment) => {
    if (!canManage) {
      return;
    }

    const confirmed = window.confirm(`Confirmer la suppression de l'equipement ${equipment.code} ?`);
    if (!confirmed) {
      return;
    }

    setDeletingEquipmentId(equipment.id);

    try {
      await deleteEquipment(equipment.id);
      toast.success("Equipement supprime avec succes.");

      if (selectedEquipment?.id === equipment.id) {
        setDetailsOpen(false);
        setSelectedEquipment(null);
      }

      await refreshEquipments(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Suppression impossible."));
    } finally {
      setDeletingEquipmentId(null);
    }
  };

  const handleExportCsv = async () => {
    if (!canExport) {
      return;
    }

    setExportingCsv(true);

    try {
      await downloadEquipmentsCsv();
      toast.success("Export CSV des equipements telecharge.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible d'exporter les equipements en CSV."));
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Equipements</h1>
          <p>Gestion centralisee des actifs industriels, de leur etat et de leur criticite.</p>
        </div>
        <div className="ds-button-group">
          <Button variant="outline" onClick={() => void refreshEquipments(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          {canExport ? <ExportCsvButton loading={exportingCsv} onClick={() => void handleExportCsv()} /> : null}
          {canManage ? (
            <Button onClick={openCreateDrawer}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel equipement
            </Button>
          ) : null}
        </div>
      </div>

      <ListQueryControls
        title="Filtres"
        description="Recherche, tri et filtrage serveur des equipements."
        searchValue={searchInput}
        searchPlaceholder="Rechercher code, nom, marque, modele..."
        onSearchChange={(value) => {
          setSearchInput(value);
          setPage(0);
        }}
        sortValue={sort}
        sortOptions={EQUIPMENT_SORT_OPTIONS}
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
        <FilterField label="Nom">
          <Input
            placeholder="Filtrer par nom..."
            value={nameFilter}
            onChange={(event) => {
              setNameFilter(event.target.value);
              setPage(0);
            }}
          />
        </FilterField>
        <FilterField label="Categorie">
          <Input
            placeholder="Filtrer par categorie..."
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(0);
            }}
          />
        </FilterField>
        <FilterField label="Statut">
          <Select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(0);
            }}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="OPERATIONAL">Operationnel</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OUT_OF_SERVICE">Hors service</option>
          </Select>
        </FilterField>
        <FilterField label="Criticite">
          <Select
            value={criticalityFilter}
            onChange={(event) => {
              setCriticalityFilter(event.target.value as CriticalityFilter);
              setPage(0);
            }}
          >
            <option value="ALL">Toutes les criticites</option>
            <option value="LOW">Faible</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </Select>
        </FilterField>
      </ListQueryControls>

      {listError ? (
        <PageErrorState description={listError} onRetry={() => void refreshEquipments(true)} />
      ) : loading ? (
        <PageLoadingState
          title="Chargement des equipements..."
          description="Recuperation des donnees depuis l'API."
        />
      ) : totalElements === 0 ? (
        <PageEmptyState
          title="Aucun equipement trouve"
          description="Commence par ajouter un premier equipement pour initialiser le parc industriel."
          icon={Wrench}
          action={canManage ? { label: "Creer un equipement", onClick: openCreateDrawer } : undefined}
        />
      ) : (
        <Card className="border-border/90 bg-surface">
          <CardHeader>
            <CardTitle>Liste des equipements</CardTitle>
            <CardDescription>
              {equipments.length} element(s) sur {totalElements}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <EquipmentTable
              equipments={equipments}
              canManage={canManage}
              deletingEquipmentId={deletingEquipmentId}
              onView={(equipment) => {
                void openDetailsDrawer(equipment);
              }}
              onEdit={(equipment) => {
                void openEditDrawer(equipment);
              }}
              onDelete={(equipment) => {
                void handleDelete(equipment);
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

      <EquipmentFormDrawer
        open={formOpen}
        mode={formMode}
        loadingInitialData={loadingInitialFormData}
        submitting={submittingForm}
        initialValues={formInitialValues}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <EquipmentDetailsDrawer
        open={detailsOpen}
        loading={detailsLoading}
        equipment={selectedEquipment}
        onClose={() => setDetailsOpen(false)}
      />
    </section>
  );
}
