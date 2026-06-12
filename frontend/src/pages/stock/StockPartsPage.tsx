import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, Boxes, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { filterNotificationsByType } from "@/components/notifications";
import {
  SparePartFormDrawer,
  SparePartTable,
  StockMovementDrawer,
  StockMovementHistoryTable,
} from "@/components/stock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FilterField, ListQueryControls } from "@/components/ui/list-query-controls";
import { PageErrorState, PageLoadingState, PageRestrictedState } from "@/components/ui/page-states";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useToast } from "@/context/toast-context";
import { useAccessControl } from "@/hooks/use-access-control";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { type SparePartFormValues, type StockMovementFormValues } from "@/pages/stock/stock.schema";
import { routePaths } from "@/routes/route-paths";
import { getApiErrorMessage } from "@/services/api";
import { getUnreadNotifications } from "@/services/notification-service";
import {
  createSparePart,
  getSparePartById,
  getSpareParts,
  getStockMovements,
  stockInSparePart,
  stockOutSparePart,
  updateSparePart,
} from "@/services/stock-service";
import type { NotificationItem } from "@/types/notification";
import type { SparePart, SparePartPayload, StockMovement } from "@/types/stock";

const SPARE_PART_SORT_OPTIONS = [
  { value: "id,desc", label: "Plus recentes" },
  { value: "reference,asc", label: "Reference A-Z" },
  { value: "name,asc", label: "Nom A-Z" },
  { value: "category,asc", label: "Categorie A-Z" },
  { value: "quantityInStock,asc", label: "Stock croissant" },
  { value: "quantityInStock,desc", label: "Stock decroissant" },
];

function toOptionalText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  return numericValue;
}

function toSparePartPayload(values: SparePartFormValues): SparePartPayload {
  return {
    reference: values.reference.trim(),
    name: values.name.trim(),
    category: values.category.trim(),
    quantityInStock: values.quantityInStock,
    minimumThreshold: values.minimumThreshold,
    unitPrice: Number(values.unitPrice),
  };
}

function toSparePartFormValues(sparePart: SparePart): SparePartFormValues {
  return {
    reference: sparePart.reference,
    name: sparePart.name,
    category: sparePart.category,
    quantityInStock: sparePart.quantityInStock,
    minimumThreshold: sparePart.minimumThreshold,
    unitPrice: String(sparePart.unitPrice),
  };
}

export function StockPartsPage() {
  const { can } = useAccessControl();
  const toast = useToast();
  const canManage = can("stockManage");
  const canRead = can("stockRead");

  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [criticalStockNotifications, setCriticalStockNotifications] = useState<NotificationItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minimumThresholdFilter, setMinimumThresholdFilter] = useState("");
  const [sort, setSort] = useState("id,desc");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingSparePartId, setEditingSparePartId] = useState<number | null>(null);
  const [formInitialValues, setFormInitialValues] = useState<SparePartFormValues | undefined>(undefined);
  const [loadingInitialFormData, setLoadingInitialFormData] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  const [movementOpen, setMovementOpen] = useState(false);
  const [movementMode, setMovementMode] = useState<"IN" | "OUT">("IN");
  const [movementTargetPart, setMovementTargetPart] = useState<SparePart | null>(null);
  const [processingMovementPartId, setProcessingMovementPartId] = useState<number | null>(null);

  const resetFilters = () => {
    setSearchInput("");
    setCategoryFilter("");
    setMinimumThresholdFilter("");
    setSort("id,desc");
    setPage(0);
  };

  async function refreshStockModule(showLoader: boolean) {
    if (!canRead) {
      setSpareParts([]);
      setStockMovements([]);
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
      const [partsPage, movements, unreadNotifications] = await Promise.all([
        getSpareParts({
          page,
          size,
          sort,
          search: toOptionalText(debouncedSearch),
          category: toOptionalText(categoryFilter),
          minimumThreshold: toOptionalNumber(minimumThresholdFilter),
        }),
        getStockMovements(),
        getUnreadNotifications(),
      ]);

      if (partsPage.totalPages > 0 && page > partsPage.totalPages - 1) {
        setPage(partsPage.totalPages - 1);
        return;
      }

      setSpareParts(partsPage.content);
      setTotalElements(partsPage.totalElements);
      setTotalPages(partsPage.totalPages);
      setStockMovements(movements);
      setCriticalStockNotifications(filterNotificationsByType(unreadNotifications, "CRITICAL_STOCK"));
      setListError(null);
    } catch (error) {
      setListError(getApiErrorMessage(error, "Impossible de charger les donnees de stock."));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refreshStockModule(true);
  }, [canRead, page, size, sort, debouncedSearch, categoryFilter, minimumThresholdFilter]);

  const sortedStockMovements = useMemo(() => {
    return [...stockMovements].sort((a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime());
  }, [stockMovements]);

  const criticalPartsOnPage = useMemo(() => {
    return spareParts.filter((part) => part.quantityInStock <= part.minimumThreshold).length;
  }, [spareParts]);

  const warningPartsOnPage = useMemo(() => {
    return spareParts.filter(
      (part) => part.quantityInStock > part.minimumThreshold && part.quantityInStock <= part.minimumThreshold * 1.5,
    ).length;
  }, [spareParts]);

  const openCreateDrawer = () => {
    setFormMode("create");
    setEditingSparePartId(null);
    setFormInitialValues(undefined);
    setLoadingInitialFormData(false);
    setFormOpen(true);
  };

  const openEditDrawer = async (sparePart: SparePart) => {
    setFormMode("edit");
    setEditingSparePartId(sparePart.id);
    setFormInitialValues(undefined);
    setLoadingInitialFormData(true);
    setFormOpen(true);

    try {
      const freshSparePart = await getSparePartById(sparePart.id);
      setFormInitialValues(toSparePartFormValues(freshSparePart));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de charger le detail de la piece."));
      setFormOpen(false);
    } finally {
      setLoadingInitialFormData(false);
    }
  };

  const openMovementDrawer = (mode: "IN" | "OUT", sparePart: SparePart) => {
    setMovementMode(mode);
    setMovementTargetPart(sparePart);
    setMovementOpen(true);
  };

  const handleFormSubmit = async (values: SparePartFormValues) => {
    const payload = toSparePartPayload(values);
    setSubmittingForm(true);

    try {
      if (formMode === "create") {
        await createSparePart(payload);
        toast.success("Piece creee avec succes.");
      } else if (editingSparePartId) {
        await updateSparePart(editingSparePartId, payload);
        toast.success("Piece mise a jour avec succes.");
      }

      setFormOpen(false);
      await refreshStockModule(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Operation impossible sur la piece."));
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleMovementSubmit = async (values: StockMovementFormValues) => {
    if (!movementTargetPart) {
      return;
    }

    setProcessingMovementPartId(movementTargetPart.id);

    try {
      if (movementMode === "IN") {
        await stockInSparePart(movementTargetPart.id, { quantity: values.quantity });
        toast.success("Entree de stock enregistree avec succes.");
      } else {
        await stockOutSparePart(movementTargetPart.id, { quantity: values.quantity });
        toast.success("Sortie de stock enregistree avec succes.");
      }

      setMovementOpen(false);
      await refreshStockModule(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Mouvement de stock impossible."));
    } finally {
      setProcessingMovementPartId(null);
    }
  };

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Stock et pieces</h1>
          <p>Gestion des pieces de rechange, niveaux de stock et historique des mouvements.</p>
        </div>
        <div className="ds-button-group">
          <Button variant="outline" onClick={() => void refreshStockModule(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          {canManage ? (
            <Button onClick={openCreateDrawer}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle piece
            </Button>
          ) : null}
        </div>
      </div>

      <ListQueryControls
        title="Filtres"
        description="Recherche, tri et filtrage serveur des pieces de rechange."
        searchValue={searchInput}
        searchPlaceholder="Rechercher reference, designation, categorie..."
        onSearchChange={(value) => {
          setSearchInput(value);
          setPage(0);
        }}
        sortValue={sort}
        sortOptions={SPARE_PART_SORT_OPTIONS}
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
        <FilterField label="Seuil minimum">
          <Input
            type="number"
            min={0}
            placeholder="Seuil minimum exact..."
            value={minimumThresholdFilter}
            onChange={(event) => {
              setMinimumThresholdFilter(event.target.value);
              setPage(0);
            }}
          />
        </FilterField>
      </ListQueryControls>

      {!canRead ? (
        <PageRestrictedState
          description="Votre role ne permet pas l'acces a la gestion du stock. Les permissions backend sont reservees aux roles ADMIN et STOREKEEPER."
          icon={Boxes}
        />
      ) : listError ? (
        <PageErrorState description={listError} onRetry={() => void refreshStockModule(true)} />
      ) : loading ? (
        <PageLoadingState title="Chargement du stock..." description="Recuperation des pieces et des mouvements." />
      ) : (
        <>
          <Card
            className={cn(
              "border-border/90 bg-surface",
              (criticalPartsOnPage > 0 || criticalStockNotifications.length > 0) && "border-destructive/25 bg-destructive/5",
            )}
          >
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Etat critique du stock
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {criticalPartsOnPage > 0
                    ? `${criticalPartsOnPage} piece(s) en seuil critique sur cette page.`
                    : "Aucune piece en seuil critique sur cette page."}
                </p>
                {criticalStockNotifications.length > 0 ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                    <BellRing className="h-3.5 w-3.5" />
                    {criticalStockNotifications.length} notification(s) backend non lue(s) sur le stock critique.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={criticalPartsOnPage > 0 ? "destructive" : "outline"}>Critique: {criticalPartsOnPage}</Badge>
                <Badge variant={warningPartsOnPage > 0 ? "warning" : "outline"}>A surveiller: {warningPartsOnPage}</Badge>
                {criticalStockNotifications.length > 0 ? (
                  <Link to={routePaths.notifications}>
                    <Button variant="outline" size="sm">
                      Ouvrir notifications
                    </Button>
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/90 bg-surface">
            <CardHeader>
              <CardTitle>Pieces de rechange</CardTitle>
              <CardDescription>
                {spareParts.length} element(s) sur {totalElements}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {spareParts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/80 bg-surface-elevated p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2">
                      <Boxes className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Aucune piece trouvee</p>
                        <p className="text-xs text-muted-foreground">
                          Aucune piece ne correspond aux filtres selectionnes.
                        </p>
                      </div>
                    </div>
                    {canManage ? (
                      <Button variant="outline" size="sm" onClick={openCreateDrawer}>
                        Ajouter une piece
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <SparePartTable
                  spareParts={spareParts}
                  canManage={canManage}
                  processingMovementPartId={processingMovementPartId}
                  onEdit={(sparePart) => {
                    void openEditDrawer(sparePart);
                  }}
                  onStockIn={(sparePart) => openMovementDrawer("IN", sparePart)}
                  onStockOut={(sparePart) => openMovementDrawer("OUT", sparePart)}
                />
              )}

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

          <Card className="border-border/90 bg-surface">
            <CardHeader>
              <CardTitle>Historique des mouvements</CardTitle>
              <CardDescription>Dernieres operations d'entree et sortie de stock.</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedStockMovements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/80 bg-surface-elevated p-4">
                  <div className="flex items-start gap-2">
                    <RefreshCw className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Aucun mouvement enregistre</p>
                      <p className="text-xs text-muted-foreground">
                        Les prochaines entrees et sorties de stock apparaitront ici.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <StockMovementHistoryTable movements={sortedStockMovements} />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <SparePartFormDrawer
        open={formOpen}
        mode={formMode}
        loadingInitialData={loadingInitialFormData}
        submitting={submittingForm}
        initialValues={formInitialValues}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <StockMovementDrawer
        open={movementOpen}
        mode={movementMode}
        loading={processingMovementPartId !== null}
        sparePart={movementTargetPart}
        onClose={() => setMovementOpen(false)}
        onSubmit={handleMovementSubmit}
      />
    </section>
  );
}
