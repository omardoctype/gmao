import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, RefreshCw, ShieldAlert, TrendingUp } from "lucide-react";
import {
  PredictiveRagAnalysisDrawer,
  PredictiveRecommendedActionCard,
  PredictiveRiskLevelBadge,
  PredictiveRiskReasonsPanel,
  PredictiveRiskScoreCard,
  PredictiveRiskTable,
  predictiveRiskLevelLabel,
} from "@/components/predictive-maintenance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterField, ListQueryControls } from "@/components/ui/list-query-controls";
import { PageEmptyState, PageErrorState, PageLoadingState, PageRestrictedState } from "@/components/ui/page-states";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/toast-context";
import { useAccessControl } from "@/hooks/use-access-control";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  ApiHttpError,
  getApiErrorMessage,
  isTimeoutError,
} from "@/services/api";
import {
  getPredictiveDashboard,
  getPredictiveRagAnalysis,
  getPredictiveRiskByEquipmentId,
  getPredictiveRisks,
} from "@/services/predictive-maintenance-service";
import type {
  PredictiveDashboardSummary,
  PredictiveRagAnalysisResponse,
  PredictiveRiskEquipment,
  PredictiveRiskLevel,
} from "@/types/predictive-maintenance";

const AI_TIMEOUT_ERROR_MESSAGE = "Le service IA a pris trop de temps a repondre. Veuillez reessayer.";
const AI_ENDPOINT_UNAVAILABLE_MESSAGE =
  "L'analyse IA predictive n'est pas disponible sur ce backend. Le module risque reste consultable.";

const PREDICTIVE_SORT_OPTIONS = [
  { value: "riskScore,desc", label: "Risque le plus eleve" },
  { value: "riskScore,asc", label: "Risque le plus faible" },
  { value: "equipmentCode,asc", label: "Code A-Z" },
  { value: "equipmentCode,desc", label: "Code Z-A" },
];

type RiskLevelFilter = "ALL" | PredictiveRiskLevel;

function comparePredictiveRows(
  left: PredictiveRiskEquipment,
  right: PredictiveRiskEquipment,
  sort: string,
): number {
  if (sort === "riskScore,asc") {
    return left.riskScore - right.riskScore;
  }
  if (sort === "riskScore,desc") {
    return right.riskScore - left.riskScore;
  }
  if (sort === "equipmentCode,desc") {
    return right.equipmentCode.localeCompare(left.equipmentCode, "fr", { sensitivity: "base" });
  }

  return left.equipmentCode.localeCompare(right.equipmentCode, "fr", { sensitivity: "base" });
}

function includesSearchMatch(value: string | null | undefined, searchTerm: string): boolean {
  if (!value) {
    return false;
  }
  return value.toLowerCase().includes(searchTerm);
}

interface KpiTileProps {
  label: string;
  value: string;
  tone?: "neutral" | "low" | "medium" | "high" | "critical";
}

function KpiTile({ label, value, tone = "neutral" }: KpiTileProps) {
  const accentClass =
    tone === "critical"
      ? "text-destructive"
      : tone === "high"
        ? "text-warning"
        : tone === "medium"
          ? "text-primary"
          : tone === "low"
            ? "text-success"
            : "text-foreground";

  return (
    <Card className="border-border/90 bg-surface">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold ${accentClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function PredictiveMaintenancePage() {
  const { canAccessRoute, can } = useAccessControl();
  const toast = useToast();

  const canReadPredictive = canAccessRoute("predictiveMaintenance");
  const canAnalyzeByRole = can("aiAssistantAsk");

  const [dashboard, setDashboard] = useState<PredictiveDashboardSummary | null>(null);
  const [allRisks, setAllRisks] = useState<PredictiveRiskEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [riskLevelFilter, setRiskLevelFilter] = useState<RiskLevelFilter>("ALL");
  const [sort, setSort] = useState("riskScore,desc");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [selectedRiskDetail, setSelectedRiskDetail] = useState<PredictiveRiskEquipment | null>(null);
  const [viewingRiskEquipmentId, setViewingRiskEquipmentId] = useState<number | null>(null);

  const [aiEndpointAvailable, setAiEndpointAvailable] = useState(true);
  const [analyzingAiEquipmentId, setAnalyzingAiEquipmentId] = useState<number | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<PredictiveRagAnalysisResponse | null>(null);
  const [aiAnalysisDrawerOpen, setAiAnalysisDrawerOpen] = useState(false);
  const [aiAnalysisEquipment, setAiAnalysisEquipment] = useState<PredictiveRiskEquipment | null>(null);

  const canAnalyzeWithAi = canAnalyzeByRole && aiEndpointAvailable;

  const resetFilters = () => {
    setSearchInput("");
    setRiskLevelFilter("ALL");
    setSort("riskScore,desc");
    setPage(0);
  };

  async function loadPredictive(showLoader: boolean) {
    if (!canReadPredictive) {
      setLoading(false);
      setRefreshing(false);
      setDashboard(null);
      setAllRisks([]);
      setListError(null);
      return;
    }

    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setListError(null);

    try {
      const [dashboardResponse, risksResponse] = await Promise.all([
        getPredictiveDashboard(),
        getPredictiveRisks(),
      ]);

      setDashboard(dashboardResponse);
      setAllRisks(risksResponse);
      setSelectedRiskDetail((current) => {
        if (!current) {
          return current;
        }
        return risksResponse.find((item) => item.equipmentId === current.equipmentId) ?? current;
      });
    } catch (error) {
      setListError(getApiErrorMessage(error, "Impossible de charger les donnees de maintenance predictive."));
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    void loadPredictive(true);
  }, [canReadPredictive]);

  const filteredRisks = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();

    return allRisks
      .filter((item) => (riskLevelFilter === "ALL" ? true : item.riskLevel === riskLevelFilter))
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          includesSearchMatch(item.equipmentCode, normalizedSearch) ||
          includesSearchMatch(item.equipmentName, normalizedSearch) ||
          includesSearchMatch(item.category, normalizedSearch) ||
          includesSearchMatch(item.location, normalizedSearch)
        );
      })
      .sort((left, right) => comparePredictiveRows(left, right, sort));
  }, [allRisks, debouncedSearch, riskLevelFilter, sort]);

  const totalElements = filteredRisks.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));

  useEffect(() => {
    const maxPage = Math.max(0, totalPages - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, totalPages]);

  const pagedRisks = useMemo(() => {
    const start = page * size;
    return filteredRisks.slice(start, start + size);
  }, [filteredRisks, page, size]);

  const showTableEmptyState = totalElements === 0 && !loading && !listError;

  const handleViewRiskDetail = async (equipment: PredictiveRiskEquipment) => {
    setSelectedRiskDetail(equipment);
    setViewingRiskEquipmentId(equipment.equipmentId);
    setAiAnalysisError(null);

    try {
      const detail = await getPredictiveRiskByEquipmentId(equipment.equipmentId);
      setSelectedRiskDetail(detail);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de charger le detail du risque equipement."));
    } finally {
      setViewingRiskEquipmentId(null);
    }
  };

  const runPredictiveAiAnalysis = async (equipment: PredictiveRiskEquipment) => {
    if (!canAnalyzeWithAi) {
      return;
    }

    setAnalyzingAiEquipmentId(equipment.equipmentId);
    setAiAnalysisError(null);
    setAiAnalysis(null);

    try {
      const response = await getPredictiveRagAnalysis(equipment.equipmentId);
      setAiAnalysis(response);
      setAiEndpointAvailable(true);
      toast.success(`Analyse IA terminee pour ${response.equipmentCode}.`);
    } catch (error) {
      if (error instanceof ApiHttpError && error.status === 404) {
        setAiEndpointAvailable(false);
        setAiAnalysisError(AI_ENDPOINT_UNAVAILABLE_MESSAGE);
      } else if (isTimeoutError(error)) {
        setAiAnalysisError(AI_TIMEOUT_ERROR_MESSAGE);
      } else {
        setAiAnalysisError(getApiErrorMessage(error, "Impossible de lancer l'analyse IA predictive."));
      }
    } finally {
      setAnalyzingAiEquipmentId(null);
    }
  };

  const handleAnalyzeWithAi = async (equipment: PredictiveRiskEquipment) => {
    if (!canAnalyzeWithAi) {
      return;
    }

    setAiAnalysisEquipment(equipment);
    setAiAnalysisDrawerOpen(true);
    await runPredictiveAiAnalysis(equipment);
  };

  const handleRetryAiAnalysis = () => {
    if (!aiAnalysisEquipment) {
      return;
    }
    void runPredictiveAiAnalysis(aiAnalysisEquipment);
  };

  const handleCloseAiAnalysisDrawer = () => {
    setAiAnalysisDrawerOpen(false);
    setAiAnalysisEquipment(null);
    setAiAnalysis(null);
    setAiAnalysisError(null);
  };

  if (!canReadPredictive) {
    return (
      <section className="ds-stack animate-fade-in-up">
        <PageRestrictedState
          title="Acces restreint a la maintenance predictive"
          description="Cette page est reservee aux roles ADMIN, RESPONSABLE_MAINTENANCE, TECHNICIAN et DIRECTION."
          icon={ShieldAlert}
        />
      </section>
    );
  }

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Maintenance predictive</h1>
          <p>Priorisation preventive des equipements selon un score de risque explicable et une analyse IA contextuelle.</p>
        </div>
        <div className="ds-button-group">
          <Button variant="outline" onClick={() => void loadPredictive(false)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          {dashboard ? <Badge variant="outline">Score moyen: {dashboard.averageRiskScore.toFixed(1)}</Badge> : null}
        </div>
      </div>

      {loading ? (
        <PageLoadingState
          title="Chargement de la maintenance predictive..."
          description="Recuperation des scores de risque et des indicateurs globaux."
        />
      ) : listError ? (
        <PageErrorState description={listError} onRetry={() => void loadPredictive(true)} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiTile label="LOW" value={String(dashboard?.lowCount ?? 0)} tone="low" />
            <KpiTile label="MEDIUM" value={String(dashboard?.mediumCount ?? 0)} tone="medium" />
            <KpiTile label="HIGH" value={String(dashboard?.highCount ?? 0)} tone="high" />
            <KpiTile label="CRITICAL" value={String(dashboard?.criticalCount ?? 0)} tone="critical" />
            <KpiTile label="Score moyen" value={`${(dashboard?.averageRiskScore ?? 0).toFixed(1)}/100`} />
          </div>

          <Card className="border-border/90 bg-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top equipements a risque
              </CardTitle>
              <CardDescription>Top 5 des equipements les plus critiques selon le module predictif.</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard?.topRiskEquipments?.length ? (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {dashboard.topRiskEquipments.map((equipment) => (
                    <article
                      key={equipment.equipmentId}
                      className="rounded-lg border border-border/80 bg-surface-elevated px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{equipment.equipmentCode}</p>
                          <p className="text-sm text-foreground">{equipment.equipmentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {equipment.category} {equipment.location ? `- ${equipment.location}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <PredictiveRiskLevelBadge riskLevel={equipment.riskLevel} />
                          <span className="text-sm font-semibold text-foreground">{equipment.riskScore}/100</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <PageEmptyState
                  title="Aucun equipement a risque pour le moment"
                  description="Le classement des equipements apparaitra des que les donnees predictives seront disponibles."
                />
              )}
            </CardContent>
          </Card>

          <ListQueryControls
            title="Filtres"
            description="Recherche par code/nom et filtrage par niveau de risque."
            searchValue={searchInput}
            searchPlaceholder="Rechercher un equipement par code, nom, categorie, localisation..."
            onSearchChange={(value) => {
              setSearchInput(value);
              setPage(0);
            }}
            sortValue={sort}
            sortOptions={PREDICTIVE_SORT_OPTIONS}
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
            <FilterField label="Niveau de risque">
              <Select
                value={riskLevelFilter}
                onChange={(event) => {
                  setRiskLevelFilter(event.target.value as RiskLevelFilter);
                  setPage(0);
                }}
              >
                <option value="ALL">Tous les niveaux</option>
                <option value="LOW">{predictiveRiskLevelLabel("LOW")}</option>
                <option value="MEDIUM">{predictiveRiskLevelLabel("MEDIUM")}</option>
                <option value="HIGH">{predictiveRiskLevelLabel("HIGH")}</option>
                <option value="CRITICAL">{predictiveRiskLevelLabel("CRITICAL")}</option>
              </Select>
            </FilterField>
          </ListQueryControls>

          {showTableEmptyState ? (
            <PageEmptyState
              title="Aucun equipement ne correspond aux filtres"
              description="Ajustez la recherche ou le niveau de risque pour afficher des resultats."
            />
          ) : (
            <Card className="border-border/90 bg-surface">
              <CardHeader>
                <CardTitle>Tableau des risques equipements</CardTitle>
                <CardDescription>
                  {pagedRisks.length} element(s) affiches sur {totalElements}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PredictiveRiskTable
                  equipments={pagedRisks}
                  viewingRiskEquipmentId={viewingRiskEquipmentId}
                  analyzingAiEquipmentId={analyzingAiEquipmentId}
                  canAnalyzeWithAi={canAnalyzeWithAi}
                  onViewRiskDetail={(equipment) => {
                    void handleViewRiskDetail(equipment);
                  }}
                  onAnalyzeWithAi={(equipment) => {
                    void handleAnalyzeWithAi(equipment);
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

          {selectedRiskDetail ? (
            <Card className="border-border/90 bg-surface">
              <CardHeader>
                <CardTitle>Detail du risque - {selectedRiskDetail.equipmentCode}</CardTitle>
                <CardDescription>{selectedRiskDetail.equipmentName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                  <PredictiveRiskScoreCard
                    riskScore={selectedRiskDetail.riskScore}
                    riskLevel={selectedRiskDetail.riskLevel}
                  />
                  <PredictiveRecommendedActionCard recommendedAction={selectedRiskDetail.recommendedAction} />
                </div>

                <PredictiveRiskReasonsPanel reasons={selectedRiskDetail.reasons} />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    onClick={() => void handleAnalyzeWithAi(selectedRiskDetail)}
                    disabled={!canAnalyzeWithAi || analyzingAiEquipmentId !== null}
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    {analyzingAiEquipmentId === selectedRiskDetail.equipmentId ? "Analyse IA en cours..." : "Analyser avec IA"}
                  </Button>
                  <Button variant="ghost" disabled>
                    Creer OT preventif (bientot)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!canAnalyzeByRole ? (
            <Card className="border-warning/30 bg-warning/10">
              <CardContent className="flex items-start gap-2 p-4 text-sm text-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Votre role permet la consultation predictive, mais pas l'analyse IA. L'action "Analyser avec IA"
                  est reservee aux roles ADMIN, RESPONSABLE_MAINTENANCE, TECHNICIAN et DIRECTION.
                </span>
              </CardContent>
            </Card>
          ) : null}

          <PredictiveRagAnalysisDrawer
            open={aiAnalysisDrawerOpen}
            loading={analyzingAiEquipmentId !== null}
            equipment={aiAnalysisEquipment}
            analysis={aiAnalysis}
            error={aiAnalysisError}
            canRetry={canAnalyzeWithAi && aiAnalysisEquipment !== null}
            onClose={handleCloseAiAnalysisDrawer}
            onRetry={handleRetryAiAnalysis}
          />
        </>
      )}
    </section>
  );
}
