import { useEffect, useState } from "react";
import { ClipboardList, Plus, RefreshCw } from "lucide-react";
import {
  WorkOrderAssignDrawer,
  WorkOrderDetailsDrawer,
  WorkOrderFormDrawer,
  WorkOrderInterventionReportDrawer,
  WorkOrderPriorityBadge,
  WorkOrderTable,
} from "@/components/work-orders";
import { ExportCsvButton } from "@/components/exports";
import type { WorkOrderBreakdownOption, WorkOrderEquipmentOption } from "@/components/work-orders/WorkOrderFormDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterField, ListQueryControls } from "@/components/ui/list-query-controls";
import { PageEmptyState, PageErrorState, PageLoadingState, PageRestrictedState } from "@/components/ui/page-states";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select } from "@/components/ui/select";
import { useAuthContext } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { useAccessControl } from "@/hooks/use-access-control";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  type WorkOrderAssignFormValues,
  type WorkOrderFormValues,
  type WorkOrderInterventionReportFormValues,
} from "@/pages/work-orders/work-order.schema";
import { getApiErrorMessage } from "@/services/api";
import { getBreakdownOptions } from "@/services/breakdown-service";
import { getEquipmentOptions } from "@/services/equipment-service";
import { downloadWorkOrdersCsv } from "@/services/export-service";
import {
  acceptWorkOrder,
  assignWorkOrderTechnician,
  closeWorkOrderWithReport,
  createWorkOrder,
  getWorkOrderById,
  getWorkOrders,
  startWorkOrder,
  updateWorkOrder,
} from "@/services/work-order-service";
import type { WorkOrder, WorkOrderPayload, WorkOrderPriority, WorkOrderStatus, WorkOrderType } from "@/types/work-order";

const WORK_ORDER_SORT_OPTIONS = [
  { value: "createdAt,desc", label: "Plus recents" },
  { value: "createdAt,asc", label: "Plus anciens" },
  { value: "priority,desc", label: "Priorite critique d'abord" },
  { value: "status,asc", label: "Statut" },
  { value: "plannedDate,asc", label: "Date planifiee proche" },
  { value: "reference,asc", label: "Reference A-Z" },
];

type StatusFilter = "ALL" | WorkOrderStatus;
type PriorityFilter = "ALL" | WorkOrderPriority;
type TypeFilter = "ALL" | WorkOrderType;

function toOptionalText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toNullableText(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toNullableNumber(value: string | undefined): number | null {
  const normalized = toNullableText(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return "";
  }

  if (value.includes("T")) {
    return value.slice(0, 16);
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 16);
}

function toWorkOrderPayload(values: WorkOrderFormValues): WorkOrderPayload {
  return {
    reference: values.reference.trim(),
    type: values.type,
    status: values.status,
    priority: values.priority,
    plannedDate: toNullableText(values.plannedDate),
    estimatedDurationMinutes: toNullableNumber(values.estimatedDurationMinutes),
    estimatedCost: toNullableNumber(values.estimatedCost),
    realCost: toNullableNumber(values.realCost),
    description: values.description.trim(),
    equipmentId: values.equipmentId,
    breakdownId: values.breakdownId,
  };
}

function toWorkOrderFormValues(workOrder: WorkOrder): WorkOrderFormValues {
  return {
    reference: workOrder.reference,
    type: workOrder.type,
    status: workOrder.status,
    priority: workOrder.priority,
    plannedDate: toDateTimeLocalValue(workOrder.plannedDate),
    estimatedDurationMinutes:
      workOrder.estimatedDurationMinutes !== null ? String(workOrder.estimatedDurationMinutes) : "",
    estimatedCost: workOrder.estimatedCost !== null ? String(workOrder.estimatedCost) : "",
    realCost: workOrder.realCost !== null ? String(workOrder.realCost) : "",
    description: workOrder.description,
    equipmentId: workOrder.equipmentId,
    breakdownId: workOrder.breakdownId,
  };
}

export function WorkOrdersPage() {
  const { can } = useAccessControl();
  const { user } = useAuthContext();
  const toast = useToast();
  const canRead = can("workOrderRead");
  const canManage = can("workOrderManage");
  const canInterventionAction = can("workOrderStart");
  const canExport = can("exportCsv");
  const currentUserId = user?.id ?? null;

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<WorkOrderEquipmentOption[]>([]);
  const [breakdownOptions, setBreakdownOptions] = useState<WorkOrderBreakdownOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [sort, setSort] = useState("createdAt,desc");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingWorkOrderId, setEditingWorkOrderId] = useState<number | null>(null);
  const [formInitialValues, setFormInitialValues] = useState<WorkOrderFormValues | undefined>(undefined);
  const [loadingInitialFormData, setLoadingInitialFormData] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTargetWorkOrder, setAssignTargetWorkOrder] = useState<WorkOrder | null>(null);
  const [assigning, setAssigning] = useState(false);

  const [closeReportOpen, setCloseReportOpen] = useState(false);
  const [closeReportTargetWorkOrder, setCloseReportTargetWorkOrder] = useState<WorkOrder | null>(null);
  const [submittingCloseReport, setSubmittingCloseReport] = useState(false);

  const [processingActionWorkOrderId, setProcessingActionWorkOrderId] = useState<number | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  const isAssignedTechnician = (workOrder: WorkOrder): boolean => {
    if (!canInterventionAction || currentUserId === null || workOrder.assignedTechnicianId === null) {
      return false;
    }

    return String(workOrder.assignedTechnicianId) === String(currentUserId);
  };

  const refreshSelectedWorkOrder = async (workOrderId: number) => {
    if (!detailsOpen || selectedWorkOrder?.id !== workOrderId) {
      return;
    }

    try {
      const freshWorkOrder = await getWorkOrderById(workOrderId);
      setSelectedWorkOrder(freshWorkOrder);
    } catch {
      setSelectedWorkOrder(null);
      setDetailsOpen(false);
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setTypeFilter("ALL");
    setSort("createdAt,desc");
    setPage(0);
  };

  async function loadFormOptions() {
    if (!canManage) {
      return;
    }

    try {
      const [equipments, breakdowns] = await Promise.all([getEquipmentOptions(), getBreakdownOptions()]);
      setEquipmentOptions(
        equipments.map((equipment) => ({
          id: equipment.id,
          code: equipment.code,
          name: equipment.name,
        })),
      );
      setBreakdownOptions(
        breakdowns.map((breakdown) => ({
          id: breakdown.id,
          reference: breakdown.reference,
          title: breakdown.title,
        })),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de charger les donnees de reference (equipements/pannes)."));
    }
  }

  async function refreshWorkOrders(showLoader: boolean) {
    if (!canRead) {
      setWorkOrders([]);
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
      const data = await getWorkOrders({
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

      setWorkOrders(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setListError(null);
    } catch (error) {
      setListError(getApiErrorMessage(error, "Impossible de charger les ordres de travail."));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refreshWorkOrders(true);
  }, [canRead, page, size, sort, debouncedSearch, statusFilter, priorityFilter, typeFilter]);

  useEffect(() => {
    void loadFormOptions();
  }, [canManage]);

  const openCreateDrawer = () => {
    setFormMode("create");
    setEditingWorkOrderId(null);
    setFormInitialValues(undefined);
    setLoadingInitialFormData(false);
    setFormOpen(true);
  };

  const openEditDrawer = async (workOrder: WorkOrder) => {
    setFormMode("edit");
    setEditingWorkOrderId(workOrder.id);
    setFormInitialValues(undefined);
    setLoadingInitialFormData(true);
    setFormOpen(true);

    try {
      const freshWorkOrder = await getWorkOrderById(workOrder.id);
      setFormInitialValues(toWorkOrderFormValues(freshWorkOrder));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de charger le detail de l'ordre de travail."));
      setFormOpen(false);
    } finally {
      setLoadingInitialFormData(false);
    }
  };

  const openDetailsDrawer = async (workOrder: WorkOrder) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setSelectedWorkOrder(null);

    try {
      const freshWorkOrder = await getWorkOrderById(workOrder.id);
      setSelectedWorkOrder(freshWorkOrder);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de charger le detail de l'ordre de travail."));
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openAssignDrawer = (workOrder: WorkOrder) => {
    setAssignTargetWorkOrder(workOrder);
    setAssignOpen(true);
  };

  const handleFormSubmit = async (values: WorkOrderFormValues) => {
    const payload = toWorkOrderPayload(values);
    setSubmittingForm(true);

    try {
      if (formMode === "create") {
        await createWorkOrder({
          ...payload,
          status: "CREATED",
        });
        toast.success("Ordre de travail cree avec succes.");
      } else if (editingWorkOrderId) {
        await updateWorkOrder(editingWorkOrderId, payload);
        toast.success("Ordre de travail mis a jour avec succes.");
      }

      setFormOpen(false);
      await refreshWorkOrders(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Operation impossible sur l'ordre de travail."));
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleAssignSubmit = async (values: WorkOrderAssignFormValues) => {
    if (!assignTargetWorkOrder) {
      return;
    }

    setAssigning(true);

    try {
      await assignWorkOrderTechnician(assignTargetWorkOrder.id, values.technicianId);
      toast.success("Technicien affecte avec succes.");
      setAssignOpen(false);
      await refreshWorkOrders(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Affectation impossible."));
    } finally {
      setAssigning(false);
    }
  };

  const handleAccept = async (workOrder: WorkOrder) => {
    if (!isAssignedTechnician(workOrder)) {
      return;
    }

    setProcessingActionWorkOrderId(workOrder.id);

    try {
      await acceptWorkOrder(workOrder.id);
      toast.success("Ordre de travail pris en charge.");
      await refreshWorkOrders(false);
      await refreshSelectedWorkOrder(workOrder.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Prise en charge refusee pour cet ordre de travail."));
    } finally {
      setProcessingActionWorkOrderId(null);
    }
  };

  const handleStart = async (workOrder: WorkOrder) => {
    if (!isAssignedTechnician(workOrder)) {
      return;
    }

    setProcessingActionWorkOrderId(workOrder.id);

    try {
      await startWorkOrder(workOrder.id);
      toast.success("Intervention demarree avec succes.");
      await refreshWorkOrders(false);
      await refreshSelectedWorkOrder(workOrder.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Demarrage impossible pour cet ordre de travail."));
    } finally {
      setProcessingActionWorkOrderId(null);
    }
  };

  const openCloseReportDrawer = (workOrder: WorkOrder) => {
    if (!isAssignedTechnician(workOrder)) {
      return;
    }

    setCloseReportTargetWorkOrder(workOrder);
    setCloseReportOpen(true);
  };

  const handleCloseReportSubmit = async (values: WorkOrderInterventionReportFormValues) => {
    if (!closeReportTargetWorkOrder) {
      return;
    }

    setSubmittingCloseReport(true);
    setProcessingActionWorkOrderId(closeReportTargetWorkOrder.id);

    try {
      const report = await closeWorkOrderWithReport(closeReportTargetWorkOrder.id, {
        performedTasks: values.performedTasks.trim(),
        realDiagnosis: toNullableText(values.realDiagnosis),
        rootCause: toNullableText(values.rootCause),
        usedParts: toNullableText(values.usedParts),
        interventionDurationMinutes: toNullableNumber(values.interventionDurationMinutes),
        finalResult: values.finalResult.trim(),
        futureRecommendations: toNullableText(values.futureRecommendations),
      });

      const documentName = report.equipmentDocument?.originalFileName;
      toast.success(
        documentName
          ? `OT cloture. Rapport attache a l'equipement: ${documentName}.`
          : "OT cloture. Rapport d'intervention enregistre.",
      );
      setCloseReportOpen(false);
      setCloseReportTargetWorkOrder(null);
      await refreshWorkOrders(false);
      await refreshSelectedWorkOrder(closeReportTargetWorkOrder.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Cloture avec rapport impossible pour cet ordre de travail."));
    } finally {
      setSubmittingCloseReport(false);
      setProcessingActionWorkOrderId(null);
    }
  };

  const handleExportCsv = async () => {
    if (!canExport) {
      return;
    }

    setExportingCsv(true);

    try {
      await downloadWorkOrdersCsv();
      toast.success("Export CSV des ordres de travail telecharge.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible d'exporter les ordres de travail en CSV."));
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Ordres de travail</h1>
          <p>Planification, affectation et suivi d'execution des interventions de maintenance.</p>
        </div>
        <div className="ds-button-group">
          <Button variant="outline" onClick={() => void refreshWorkOrders(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          {canExport ? <ExportCsvButton loading={exportingCsv} onClick={() => void handleExportCsv()} /> : null}
          {canManage ? (
            <Button onClick={openCreateDrawer}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel ordre
            </Button>
          ) : null}
        </div>
      </div>

      <ListQueryControls
        title="Filtres"
        description="Recherche, tri et filtrage serveur des ordres de travail."
        searchValue={searchInput}
        searchPlaceholder="Rechercher reference, description, type..."
        onSearchChange={(value) => {
          setSearchInput(value);
          setPage(0);
        }}
        sortValue={sort}
        sortOptions={WORK_ORDER_SORT_OPTIONS}
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
            <option value="CREATED">Cree</option>
            <option value="ASSIGNED">Affecte</option>
            <option value="ACCEPTED">Pris en charge</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="COMPLETED">Cloture</option>
            <option value="CANCELLED">Annule</option>
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
            <option value="CORRECTIVE">Corrective</option>
            <option value="PREVENTIVE">Preventive</option>
            <option value="INSPECTION">Inspection</option>
            <option value="INSTALLATION">Installation</option>
            <option value="OTHER">Autre</option>
          </Select>
        </FilterField>
      </ListQueryControls>

      {!canRead ? (
        <PageRestrictedState
          description="Votre role ne permet pas de consulter les ordres de travail."
          icon={ClipboardList}
        />
      ) : listError ? (
        <PageErrorState description={listError} onRetry={() => void refreshWorkOrders(true)} />
      ) : loading ? (
        <PageLoadingState
          title="Chargement des ordres de travail..."
          description="Recuperation des donnees depuis l'API."
        />
      ) : totalElements === 0 ? (
        <PageEmptyState
          title="Aucun ordre de travail trouve"
          description="Aucune donnee ne correspond aux filtres selectionnes, ou aucun ordre n'est encore cree."
        />
      ) : (
        <Card className="border-border/90 bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Liste des ordres de travail
              <WorkOrderPriorityBadge priority="CRITICAL" />
            </CardTitle>
            <CardDescription>
              {workOrders.length} element(s) sur {totalElements}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WorkOrderTable
              workOrders={workOrders}
              canManage={canManage}
              canInterventionAction={canInterventionAction}
              currentUserId={currentUserId}
              processingActionWorkOrderId={processingActionWorkOrderId}
              onView={(workOrder) => {
                void openDetailsDrawer(workOrder);
              }}
              onEdit={(workOrder) => {
                void openEditDrawer(workOrder);
              }}
              onAssign={openAssignDrawer}
              onAccept={(workOrder) => {
                void handleAccept(workOrder);
              }}
              onStart={(workOrder) => {
                void handleStart(workOrder);
              }}
              onClose={openCloseReportDrawer}
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

      <WorkOrderFormDrawer
        open={formOpen}
        mode={formMode}
        loadingInitialData={loadingInitialFormData}
        submitting={submittingForm}
        initialValues={formInitialValues}
        equipmentOptions={equipmentOptions}
        breakdownOptions={breakdownOptions}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <WorkOrderDetailsDrawer
        open={detailsOpen}
        loading={detailsLoading}
        workOrder={selectedWorkOrder}
        currentUserId={currentUserId}
        processingActionWorkOrderId={processingActionWorkOrderId}
        onClose={() => setDetailsOpen(false)}
        onAccept={(workOrder) => {
          void handleAccept(workOrder);
        }}
        onStart={(workOrder) => {
          void handleStart(workOrder);
        }}
        onComplete={openCloseReportDrawer}
      />

      <WorkOrderAssignDrawer
        open={assignOpen}
        loading={assigning}
        workOrder={assignTargetWorkOrder}
        onClose={() => setAssignOpen(false)}
        onSubmit={handleAssignSubmit}
      />

      <WorkOrderInterventionReportDrawer
        open={closeReportOpen}
        submitting={submittingCloseReport}
        workOrder={closeReportTargetWorkOrder}
        onClose={() => {
          setCloseReportOpen(false);
          setCloseReportTargetWorkOrder(null);
        }}
        onSubmit={handleCloseReportSubmit}
      />
    </section>
  );
}
