import { useEffect, useState } from "react";
import { CalendarCog, Plus, RefreshCw } from "lucide-react";
import {
  MaintenancePlanFormDrawer,
  type MaintenancePlanEquipmentOption,
  maintenancePlanFrequencyLabel,
  MaintenancePlanTable,
} from "@/components/maintenance-plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterField, ListQueryControls } from "@/components/ui/list-query-controls";
import { PageEmptyState, PageErrorState, PageLoadingState, PageRestrictedState } from "@/components/ui/page-states";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/toast-context";
import { useAccessControl } from "@/hooks/use-access-control";
import {
  maintenancePlanSchema,
  type MaintenancePlanFormValues,
} from "@/pages/maintenance-plans/maintenance-plan.schema";
import { getApiErrorMessage } from "@/services/api";
import { getEquipmentOptions } from "@/services/equipment-service";
import {
  createMaintenancePlan,
  deleteMaintenancePlan,
  getMaintenancePlanById,
  getMaintenancePlans,
  updateMaintenancePlan,
} from "@/services/maintenance-plan-service";
import type { MaintenancePlan, MaintenancePlanFrequency, MaintenancePlanPayload, MaintenancePlanType } from "@/types/maintenance-plan";

const MAINTENANCE_SORT_OPTIONS = [
  { value: "nextExecutionDate,asc", label: "Date d'execution proche" },
  { value: "nextExecutionDate,desc", label: "Date d'execution lointaine" },
  { value: "type,asc", label: "Type A-Z" },
  { value: "frequency,asc", label: "Frequence" },
];

type FrequencyFilter = "ALL" | MaintenancePlanFrequency;
type TypeFilter = "ALL" | MaintenancePlanType;

function toDateInputValue(value: string): string {
  if (!value) {
    return "";
  }

  if (value.includes("T")) {
    return value.slice(0, 10);
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function toMaintenancePlanFormValues(maintenancePlan: MaintenancePlan): MaintenancePlanFormValues {
  return {
    type: maintenancePlan.type,
    frequency: maintenancePlan.frequency,
    nextExecutionDate: toDateInputValue(maintenancePlan.nextExecutionDate),
    description: maintenancePlan.description,
    equipmentId: maintenancePlan.equipmentId,
  };
}

function toMaintenancePlanPayload(values: MaintenancePlanFormValues): MaintenancePlanPayload {
  const validated = maintenancePlanSchema.parse(values);

  return {
    type: validated.type,
    frequency: validated.frequency,
    nextExecutionDate: validated.nextExecutionDate,
    description: validated.description.trim(),
    equipmentId: validated.equipmentId,
  };
}

export function MaintenancePlansPage() {
  const { can } = useAccessControl();
  const toast = useToast();
  const canManage = can("maintenancePlanManage");
  const canRead = can("maintenancePlanRead");

  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<MaintenancePlanEquipmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilter>("ALL");
  const [sort, setSort] = useState("nextExecutionDate,asc");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingMaintenancePlanId, setEditingMaintenancePlanId] = useState<number | null>(null);
  const [formInitialValues, setFormInitialValues] = useState<MaintenancePlanFormValues | undefined>(undefined);
  const [loadingInitialFormData, setLoadingInitialFormData] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [deletingMaintenancePlanId, setDeletingMaintenancePlanId] = useState<number | null>(null);

  const resetFilters = () => {
    setTypeFilter("ALL");
    setFrequencyFilter("ALL");
    setSort("nextExecutionDate,asc");
    setPage(0);
  };

  async function loadEquipmentOptions() {
    if (!canManage) {
      setEquipmentOptions([]);
      return;
    }

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
      toast.error(getApiErrorMessage(error, "Impossible de charger les equipements de reference."));
    }
  }

  async function refreshMaintenancePlans(showLoader: boolean) {
    if (!canRead) {
      setMaintenancePlans([]);
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
      const data = await getMaintenancePlans({
        page,
        size,
        sort,
        type: typeFilter === "ALL" ? undefined : typeFilter,
        frequency: frequencyFilter === "ALL" ? undefined : frequencyFilter,
      });

      if (data.totalPages > 0 && page > data.totalPages - 1) {
        setPage(data.totalPages - 1);
        return;
      }

      setMaintenancePlans(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setListError(null);
    } catch (error) {
      setListError(getApiErrorMessage(error, "Impossible de charger les plans de maintenance."));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refreshMaintenancePlans(true);
  }, [canRead, page, size, sort, typeFilter, frequencyFilter]);

  useEffect(() => {
    void loadEquipmentOptions();
  }, [canManage]);

  const openCreateDrawer = () => {
    setFormMode("create");
    setEditingMaintenancePlanId(null);
    setFormInitialValues(undefined);
    setLoadingInitialFormData(false);
    setFormOpen(true);
  };

  const openEditDrawer = async (maintenancePlan: MaintenancePlan) => {
    setFormMode("edit");
    setEditingMaintenancePlanId(maintenancePlan.id);
    setFormInitialValues(undefined);
    setLoadingInitialFormData(true);
    setFormOpen(true);

    try {
      const freshMaintenancePlan = await getMaintenancePlanById(maintenancePlan.id);
      setFormInitialValues(toMaintenancePlanFormValues(freshMaintenancePlan));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de charger le detail du plan de maintenance."));
      setFormOpen(false);
    } finally {
      setLoadingInitialFormData(false);
    }
  };

  const handleFormSubmit = async (values: MaintenancePlanFormValues) => {
    const payload = toMaintenancePlanPayload(values);
    setSubmittingForm(true);

    try {
      if (formMode === "create") {
        await createMaintenancePlan(payload);
        toast.success("Plan de maintenance cree avec succes.");
      } else if (editingMaintenancePlanId) {
        await updateMaintenancePlan(editingMaintenancePlanId, payload);
        toast.success("Plan de maintenance mis a jour avec succes.");
      }

      setFormOpen(false);
      await refreshMaintenancePlans(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Operation impossible sur le plan de maintenance."));
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDelete = async (maintenancePlan: MaintenancePlan) => {
    if (!canManage) {
      return;
    }

    const confirmed = window.confirm("Confirmer la suppression de ce plan de maintenance ?");
    if (!confirmed) {
      return;
    }

    setDeletingMaintenancePlanId(maintenancePlan.id);

    try {
      await deleteMaintenancePlan(maintenancePlan.id);
      toast.success("Plan de maintenance supprime avec succes.");
      await refreshMaintenancePlans(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Suppression impossible pour ce plan de maintenance."));
    } finally {
      setDeletingMaintenancePlanId(null);
    }
  };

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Plans de maintenance</h1>
          <p>Pilotage des frequences preventives et des prochaines executions par equipement.</p>
        </div>
        <div className="ds-button-group">
          <Button variant="outline" onClick={() => void refreshMaintenancePlans(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          {canManage ? (
            <Button onClick={openCreateDrawer}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau plan
            </Button>
          ) : null}
        </div>
      </div>

      <ListQueryControls
        title="Filtres"
        description="Filtrage et tri serveur des plans de maintenance."
        columns={3}
        sortValue={sort}
        sortOptions={MAINTENANCE_SORT_OPTIONS}
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
        <FilterField label="Type">
          <Select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as TypeFilter);
              setPage(0);
            }}
          >
            <option value="ALL">Tous les types</option>
            <option value="PREVENTIVE">Preventive</option>
            <option value="PREDICTIVE">Predictive</option>
            <option value="LEGAL">Reglementaire</option>
            <option value="CONDITION_BASED">Conditionnelle</option>
            <option value="OTHER">Autre</option>
          </Select>
        </FilterField>
        <FilterField label="Frequence">
          <Select
            value={frequencyFilter}
            onChange={(event) => {
              setFrequencyFilter(event.target.value as FrequencyFilter);
              setPage(0);
            }}
          >
            <option value="ALL">Toutes les frequences</option>
            <option value="DAILY">{maintenancePlanFrequencyLabel("DAILY")}</option>
            <option value="WEEKLY">{maintenancePlanFrequencyLabel("WEEKLY")}</option>
            <option value="MONTHLY">{maintenancePlanFrequencyLabel("MONTHLY")}</option>
            <option value="QUARTERLY">{maintenancePlanFrequencyLabel("QUARTERLY")}</option>
            <option value="SEMI_ANNUAL">{maintenancePlanFrequencyLabel("SEMI_ANNUAL")}</option>
            <option value="ANNUAL">{maintenancePlanFrequencyLabel("ANNUAL")}</option>
          </Select>
        </FilterField>
      </ListQueryControls>

      {!canRead ? (
        <PageRestrictedState
          description="Votre role ne permet pas l'acces a ce module. Les plans de maintenance sont reserves au role RESPONSABLE_MAINTENANCE."
          icon={CalendarCog}
        />
      ) : listError ? (
        <PageErrorState description={listError} onRetry={() => void refreshMaintenancePlans(true)} />
      ) : loading ? (
        <PageLoadingState
          title="Chargement des plans de maintenance..."
          description="Recuperation des donnees depuis l'API."
        />
      ) : totalElements === 0 ? (
        <PageEmptyState
          title="Aucun plan de maintenance trouve"
          description="Aucun plan ne correspond aux filtres selectionnes, ou aucun plan n'est encore cree."
        />
      ) : (
        <Card className="border-border/90 bg-surface">
          <CardHeader>
            <CardTitle>Liste des plans de maintenance</CardTitle>
            <CardDescription>
              {maintenancePlans.length} element(s) sur {totalElements}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MaintenancePlanTable
              maintenancePlans={maintenancePlans}
              canManage={canManage}
              deletingMaintenancePlanId={deletingMaintenancePlanId}
              onEdit={(maintenancePlan) => {
                void openEditDrawer(maintenancePlan);
              }}
              onDelete={(maintenancePlan) => {
                void handleDelete(maintenancePlan);
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

      <MaintenancePlanFormDrawer
        open={formOpen}
        mode={formMode}
        loadingInitialData={loadingInitialFormData}
        submitting={submittingForm}
        initialValues={formInitialValues}
        equipmentOptions={equipmentOptions}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </section>
  );
}
