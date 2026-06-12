import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Bot, Brain, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { AiSourcesCards, AiStructuredAnswer } from "@/components/ai-assistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { PageRestrictedState } from "@/components/ui/page-states";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAccessControl } from "@/hooks/use-access-control";
import { appRoles } from "@/routes/access-control";
import { getApiErrorMessage, isTimeoutError } from "@/services/api";
import { askAiAssistant, getAiHealth, requestAiDiagnosis } from "@/services/ai-assistant-service";
import { getEquipmentSelectOptions, type EquipmentOption } from "@/services/equipment-service";
import { type AiAskResponse, type AiDiagnosisResponse, type AiHealthResponse } from "@/types/ai-assistant";
import {
  type AiAskFormValues,
  type AiDiagnosisFormValues,
  aiAskSchema,
  aiDiagnosisSchema,
} from "@/pages/ai-assistant/ai-assistant.schema";

function toOptionalText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

const AI_TIMEOUT_ERROR_MESSAGE = "Le service IA a pris trop de temps a repondre. Veuillez reessayer.";
const EQUIPMENT_LOADING_MESSAGE = "Chargement des equipements...";
const EQUIPMENT_EMPTY_MESSAGE = "Aucun equipement disponible";
const EQUIPMENT_ERROR_MESSAGE = "Impossible de charger la liste des equipements.";
const EQUIPMENT_REQUIRED_MESSAGE = "Veuillez selectionner un equipement.";

function formatEquipmentOption(equipment: EquipmentOption): string {
  return `${equipment.code} - ${equipment.name}`;
}

function ResultStateBox({
  title,
  description,
  tone = "default",
  loading = false,
}: {
  title: string;
  description: string;
  tone?: "default" | "error";
  loading?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        tone === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border/80 bg-surface-elevated text-foreground"
      }`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
        {title}
      </p>
      <p className={`mt-1 text-xs leading-relaxed ${tone === "error" ? "text-destructive/90" : "text-muted-foreground"}`}>
        {description}
      </p>
    </div>
  );
}

export function AiAssistantPage() {
  const { hasAnyRole } = useAccessControl();
  const canAsk = hasAnyRole([
    appRoles.admin,
    appRoles.maintenanceManager,
    appRoles.technician,
    appRoles.direction,
  ]);
  const canDiagnosis = hasAnyRole([
    appRoles.admin,
    appRoles.maintenanceManager,
    appRoles.technician,
    appRoles.operator,
  ]);

  const [health, setHealth] = useState<AiHealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askResult, setAskResult] = useState<AiAskResponse | null>(null);

  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<AiDiagnosisResponse | null>(null);

  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentOption[]>([]);
  const [equipmentOptionsLoading, setEquipmentOptionsLoading] = useState(true);
  const [equipmentOptionsError, setEquipmentOptionsError] = useState<string | null>(null);

  const askForm = useForm<AiAskFormValues>({
    resolver: zodResolver(aiAskSchema),
    defaultValues: {
      question: "",
      equipmentCode: "",
    },
  });

  const diagnosisForm = useForm<AiDiagnosisFormValues>({
    resolver: zodResolver(aiDiagnosisSchema),
    defaultValues: {
      equipmentCode: "",
      breakdownDescription: "",
    },
  });

  const loadHealth = async () => {
    setHealthError(null);
    setHealthLoading(true);
    try {
      const response = await getAiHealth();
      setHealth(response);
    } catch (error) {
      setHealthError(getApiErrorMessage(error, "Impossible de contacter le module IA backend."));
    } finally {
      setHealthLoading(false);
    }
  };

  const equipmentListStatusMessage = equipmentOptionsLoading
    ? EQUIPMENT_LOADING_MESSAGE
    : equipmentOptionsError ?? (equipmentOptions.length === 0 ? EQUIPMENT_EMPTY_MESSAGE : null);
  const equipmentSelectDisabled = equipmentOptionsLoading || Boolean(equipmentOptionsError) || equipmentOptions.length === 0;

  useEffect(() => {
    void loadHealth();
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!canAsk && !canDiagnosis) {
      setEquipmentOptions([]);
      setEquipmentOptionsError(null);
      setEquipmentOptionsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setEquipmentOptionsLoading(true);
    setEquipmentOptionsError(null);

    getEquipmentSelectOptions()
      .then((options) => {
        if (!isMounted) {
          return;
        }

        setEquipmentOptions(options);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setEquipmentOptions([]);
        setEquipmentOptionsError(EQUIPMENT_ERROR_MESSAGE);
      })
      .finally(() => {
        if (isMounted) {
          setEquipmentOptionsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canAsk, canDiagnosis]);

  const submitAsk = async (values: AiAskFormValues) => {
    if (!canAsk) {
      return;
    }

    setAskError(null);
    setAskLoading(true);
    setAskResult(null);

    try {
      const response = await askAiAssistant({
        question: values.question.trim(),
        equipmentCode: toOptionalText(values.equipmentCode),
      });
      setAskResult(response);
    } catch (error) {
      setAskError(isTimeoutError(error) ? AI_TIMEOUT_ERROR_MESSAGE : getApiErrorMessage(error, "La requete documentaire IA a echoue."));
    } finally {
      setAskLoading(false);
    }
  };

  const submitDiagnosis = async (values: AiDiagnosisFormValues) => {
    if (!canDiagnosis) {
      return;
    }

    const equipmentCode = values.equipmentCode.trim();
    const selectedEquipment = equipmentOptions.find((equipment) => equipment.code === equipmentCode);
    if (!selectedEquipment) {
      diagnosisForm.setError("equipmentCode", { message: EQUIPMENT_REQUIRED_MESSAGE });
      return;
    }

    setDiagnosisError(null);
    setDiagnosisLoading(true);
    setDiagnosisResult(null);

    try {
      const response = await requestAiDiagnosis({
        equipmentCode: selectedEquipment.code,
        breakdownDescription: values.breakdownDescription.trim(),
      });
      setDiagnosisResult(response);
    } catch (error) {
      setDiagnosisError(isTimeoutError(error) ? AI_TIMEOUT_ERROR_MESSAGE : getApiErrorMessage(error, "La demande de diagnostic IA a echoue."));
    } finally {
      setDiagnosisLoading(false);
    }
  };

  if (!canAsk && !canDiagnosis) {
    return (
      <section className="ds-stack animate-fade-in-up">
        <PageRestrictedState
          title="Acces restreint a l'assistant IA"
          description="Votre role ne permet pas d'utiliser le module Assistant Maintenance."
          icon={AlertTriangle}
        />
      </section>
    );
  }

  return (
    <section className="ds-stack animate-fade-in-up">
      <div className="ds-section-heading">
        <div>
          <h1>Assistant IA</h1>
          <p>Assistant maintenance RAG pour rechercher des procedures documentaires et proposer un diagnostic contextualise.</p>
        </div>
        <div className="ds-button-group">
          <Button variant="outline" onClick={() => void loadHealth()} disabled={healthLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${healthLoading ? "animate-spin" : ""}`} />
            Verifier le statut IA
          </Button>
        </div>
      </div>

      <Card className="border-border/90 bg-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Statut du module IA
          </CardTitle>
          <CardDescription>Verification de la connectivite backend vers le service IA FastAPI.</CardDescription>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <ResultStateBox
              title="Verification en cours"
              description="Le frontend interroge l'endpoint backend /api/ai/health."
              loading
            />
          ) : healthError ? (
            <ResultStateBox title="Service IA indisponible" description={healthError} tone="error" />
          ) : health ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/80 bg-surface-elevated p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Statut</p>
                <div className="mt-1">
                  <Badge variant={health.status === "UP" ? "success" : "warning"}>{health.status}</Badge>
                </div>
              </div>
              <div className="rounded-lg border border-border/80 bg-surface-elevated p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Service</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{health.service}</p>
              </div>
              <div className="rounded-lg border border-border/80 bg-surface-elevated p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Modele</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{health.model}</p>
              </div>
            </div>
          ) : (
            <ResultStateBox
              title="Aucune information de statut"
              description="Declenchez une verification pour charger l'etat du module IA."
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border-border/90 bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Question documentaire
            </CardTitle>
            <CardDescription>Interroger la base documentaire maintenance via /api/ai/ask.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canAsk ? (
              <ResultStateBox
                title="Acces non autorise pour cette section"
                description="Cette fonctionnalite est reservee aux roles ADMIN, RESPONSABLE_MAINTENANCE, TECHNICIAN, DIRECTION."
                tone="error"
              />
            ) : (
              <form className="ds-form" onSubmit={askForm.handleSubmit(submitAsk)}>
                <FormField
                  htmlFor="ai-ask-question"
                  label="Question"
                  required
                  error={askForm.formState.errors.question?.message}
                  hint="Exemple: Quelle procedure suivre pour une fuite hydraulique sur EQ-001 ?"
                >
                  <Textarea
                    id="ai-ask-question"
                    placeholder="Saisissez votre question documentaire..."
                    rows={5}
                    {...askForm.register("question")}
                  />
                </FormField>

                <FormField
                  htmlFor="ai-ask-equipment"
                  label="Code equipement (optionnel)"
                  error={askForm.formState.errors.equipmentCode?.message ?? equipmentOptionsError ?? undefined}
                  hint={equipmentListStatusMessage ?? "Permet de filtrer le contexte sur un equipement cible."}
                >
                  <Select
                    id="ai-ask-equipment"
                    disabled={equipmentSelectDisabled}
                    {...askForm.register("equipmentCode")}
                  >
                    <option value="">Tous les equipements / Aucun filtre</option>
                    {equipmentOptions.map((equipment) => (
                      <option key={equipment.code} value={equipment.code}>
                        {formatEquipmentOption(equipment)}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <Button type="submit" disabled={askLoading || askForm.formState.isSubmitting}>
                  {askLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {askLoading ? "Analyse IA en cours..." : "Poser la question"}
                </Button>
              </form>
            )}

            {askLoading ? (
              <ResultStateBox
                title="Generation de la reponse"
                description="Analyse IA en cours, cela peut prendre quelques secondes..."
                loading
              />
            ) : askError ? (
              <ResultStateBox title="Echec de la question documentaire" description={askError} tone="error" />
            ) : askResult ? (
              <div className="space-y-3">
                <AiStructuredAnswer answer={askResult.answer} sources={askResult.sources} />
                <AiSourcesCards sources={askResult.sources} />
              </div>
            ) : (
              <ResultStateBox
                title="Aucune reponse pour le moment"
                description="Soumettez une question pour afficher la reponse et les sources documentaires."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/90 bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Diagnostic panne
            </CardTitle>
            <CardDescription>Proposer un diagnostic et des actions recommandees via /api/ai/diagnosis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canDiagnosis ? (
              <ResultStateBox
                title="Acces non autorise pour cette section"
                description="Cette fonctionnalite est reservee aux roles ADMIN, RESPONSABLE_MAINTENANCE, TECHNICIAN et OPERATOR."
                tone="error"
              />
            ) : (
              <form className="ds-form" onSubmit={diagnosisForm.handleSubmit(submitDiagnosis)}>
                <FormField
                  htmlFor="ai-diagnosis-equipment"
                  label="Code equipement"
                  required
                  error={diagnosisForm.formState.errors.equipmentCode?.message ?? equipmentOptionsError ?? undefined}
                  hint={equipmentListStatusMessage ?? "Selectionnez un equipement existant."}
                >
                  <Select
                    id="ai-diagnosis-equipment"
                    disabled={equipmentSelectDisabled}
                    {...diagnosisForm.register("equipmentCode")}
                  >
                    <option value="">Selectionnez un equipement</option>
                    {equipmentOptions.map((equipment) => (
                      <option key={equipment.code} value={equipment.code}>
                        {formatEquipmentOption(equipment)}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField
                  htmlFor="ai-diagnosis-description"
                  label="Description de la panne"
                  required
                  error={diagnosisForm.formState.errors.breakdownDescription?.message}
                  hint="Decrivez les symptomes observes et le contexte de fonctionnement."
                >
                  <Textarea
                    id="ai-diagnosis-description"
                    placeholder="Exemple: Le moteur chauffe apres 20 minutes de fonctionnement."
                    rows={5}
                    {...diagnosisForm.register("breakdownDescription")}
                  />
                </FormField>

                <Button
                  type="submit"
                  disabled={
                    diagnosisLoading ||
                    diagnosisForm.formState.isSubmitting ||
                    equipmentOptionsLoading ||
                    Boolean(equipmentOptionsError) ||
                    equipmentOptions.length === 0
                  }
                >
                  {diagnosisLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {diagnosisLoading ? "Analyse IA en cours..." : "Proposer un diagnostic"}
                </Button>
              </form>
            )}

            {diagnosisLoading ? (
              <ResultStateBox
                title="Analyse de la panne en cours"
                description="Analyse IA en cours, cela peut prendre quelques secondes..."
                loading
              />
            ) : diagnosisError ? (
              <ResultStateBox title="Echec du diagnostic" description={diagnosisError} tone="error" />
            ) : diagnosisResult ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-border/80 bg-surface-elevated p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Diagnostic</p>
                  <p className="text-sm leading-relaxed text-foreground">{diagnosisResult.diagnosis}</p>
                </div>

                <div className="rounded-lg border border-border/80 bg-surface-elevated p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Actions recommandees</p>
                  {diagnosisResult.recommendedActions.length > 0 ? (
                    <ul className="space-y-2">
                      {diagnosisResult.recommendedActions.map((action, index) => (
                        <li key={`${action}-${index}`} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                          <span className="leading-relaxed">{action}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune action recommandee retournee pour ce diagnostic.</p>
                  )}
                </div>

                <AiSourcesCards sources={diagnosisResult.sources} />
              </div>
            ) : (
              <ResultStateBox
                title="Aucun diagnostic pour le moment"
                description="Soumettez un cas de panne pour afficher le diagnostic, les actions et les sources."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
