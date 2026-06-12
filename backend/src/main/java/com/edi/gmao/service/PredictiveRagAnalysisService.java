package com.edi.gmao.service;

import com.edi.gmao.dto.ai.AiAskRequest;
import com.edi.gmao.dto.ai.AiAskResponse;
import com.edi.gmao.dto.ai.AiSourceResponse;
import com.edi.gmao.dto.predictive.PredictiveRagAnalysisResponse;
import com.edi.gmao.dto.predictive.PredictiveRiskReason;
import com.edi.gmao.dto.predictive.PredictiveRiskResponse;
import com.edi.gmao.exception.ApiException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PredictiveRagAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(PredictiveRagAnalysisService.class);

    private static final String RAG_UNAVAILABLE_MESSAGE =
            "Analyse RAG indisponible actuellement. Le score predictif reste disponible pour la priorisation maintenance.";

    private static final String RAG_EMPTY_ANSWER_MESSAGE =
            "Le service IA n'a pas retourne d'analyse exploitable. Utilisez l'action predictive et relancez l'analyse RAG.";

    private final PredictiveMaintenanceService predictiveMaintenanceService;
    private final AiAssistantService aiAssistantService;

    public PredictiveRagAnalysisService(
            PredictiveMaintenanceService predictiveMaintenanceService,
            AiAssistantService aiAssistantService
    ) {
        this.predictiveMaintenanceService = predictiveMaintenanceService;
        this.aiAssistantService = aiAssistantService;
    }

    @Transactional(readOnly = true)
    public PredictiveRagAnalysisResponse analyzeEquipmentRiskWithRag(Long equipmentId) {
        long totalStartedAt = System.nanoTime();
        long riskStartedAt = System.nanoTime();
        PredictiveRiskResponse risk = predictiveMaintenanceService.getEquipmentRisk(equipmentId);
        long riskMs = elapsedMs(riskStartedAt);

        long promptStartedAt = System.nanoTime();
        List<String> riskReasons = toRiskReasonMessages(risk.getReasons());
        AiAskRequest askRequest = buildAskRequest(risk, riskReasons);
        long preparationMs = elapsedMs(promptStartedAt);

        String ragAnalysis = RAG_UNAVAILABLE_MESSAGE;
        List<AiSourceResponse> sources = List.of();

        long aiStartedAt = System.nanoTime();
        long aiMs = -1;
        String status = "success";
        try {
            AiAskResponse aiResponse = aiAssistantService.ask(askRequest);
            aiMs = elapsedMs(aiStartedAt);
            ragAnalysis = normalizeRagAnalysis(aiResponse.getAnswer());
            sources = sanitizeSources(aiResponse.getSources());
        } catch (ApiException ex) {
            aiMs = elapsedMs(aiStartedAt);
            status = "ai_api_error";
            ragAnalysis = RAG_UNAVAILABLE_MESSAGE;
        } catch (RuntimeException ex) {
            aiMs = elapsedMs(aiStartedAt);
            status = "ai_runtime_error";
            ragAnalysis = RAG_UNAVAILABLE_MESSAGE;
        } finally {
            log.info(
                    "Predictive RAG timing equipmentId={} status={} riskMs={} preparationMs={} aiMs={} totalMs={}",
                    equipmentId,
                    status,
                    riskMs,
                    preparationMs,
                    aiMs,
                    elapsedMs(totalStartedAt)
            );
        }

        return PredictiveRagAnalysisResponse.builder()
                .equipmentId(risk.getEquipmentId())
                .equipmentCode(risk.getEquipmentCode())
                .equipmentName(risk.getEquipmentName())
                .riskScore(risk.getRiskScore())
                .riskLevel(risk.getRiskLevel())
                .riskReasons(riskReasons)
                .predictiveRecommendedAction(risk.getRecommendedAction())
                .ragAnalysis(ragAnalysis)
                .sources(sources)
                .build();
    }

    private AiAskRequest buildAskRequest(PredictiveRiskResponse risk, List<String> riskReasons) {
        AiAskRequest request = new AiAskRequest();
        request.setEquipmentCode(risk.getEquipmentCode());
        request.setQuestion(buildRagPrompt(risk, riskReasons));
        return request;
    }

    private String buildRagPrompt(PredictiveRiskResponse risk, List<String> riskReasons) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Tu es un assistant de maintenance industrielle pour une GMAO.\n");
        prompt.append("Analyse l'equipement suivant uniquement avec les informations de la base documentaire RAG.\n");
        prompt.append("Ne cree aucune information non presente dans les sources.\n\n");
        prompt.append("Contexte equipement :\n");
        prompt.append("- Code : ").append(safeValue(risk.getEquipmentCode())).append("\n");
        prompt.append("- Nom : ").append(safeValue(risk.getEquipmentName())).append("\n");
        prompt.append("- Categorie : ").append(safeValue(risk.getCategory())).append("\n");
        prompt.append("- Localisation : ").append(safeValue(risk.getLocation())).append("\n");
        prompt.append("- Criticite : ").append(safeEnum(risk.getCriticality())).append("\n");
        prompt.append("- Statut : ").append(safeEnum(risk.getStatus())).append("\n");
        prompt.append("- Score de risque predictif : ").append(risk.getRiskScore()).append("/100\n");
        prompt.append("- Niveau de risque : ").append(risk.getRiskLevel()).append("\n");
        prompt.append("- Raisons du risque :\n");
        for (String reason : riskReasons) {
            prompt.append("  - ").append(reason).append("\n");
        }
        prompt.append("\n");
        prompt.append("Donne une analyse maintenance structuree en francais avec exactement ces sections :\n");
        prompt.append("### Diagnostic probable\n");
        prompt.append("### Causes possibles\n");
        prompt.append("### Actions recommandees\n");
        prompt.append("### Documents utilises\n");
        prompt.append("Si une information manque, indique-la clairement sans inventer.\n");
        return prompt.toString();
    }

    private List<String> toRiskReasonMessages(List<PredictiveRiskReason> reasons) {
        if (reasons == null || reasons.isEmpty()) {
            return List.of("Aucun facteur aggravant majeur detecte par les regles predictives.");
        }

        List<String> messages = new ArrayList<>();
        for (PredictiveRiskReason reason : reasons) {
            if (reason == null) {
                continue;
            }
            String detail = safeValue(reason.getDetail());
            messages.add(detail + " (+" + Math.max(0, reason.getPoints()) + " pts)");
        }

        if (messages.isEmpty()) {
            return List.of("Aucun facteur aggravant majeur detecte par les regles predictives.");
        }
        return List.copyOf(messages);
    }

    private List<AiSourceResponse> sanitizeSources(List<AiSourceResponse> sources) {
        if (sources == null || sources.isEmpty()) {
            return List.of();
        }

        List<AiSourceResponse> sanitized = new ArrayList<>();
        for (AiSourceResponse source : sources) {
            if (source == null) {
                continue;
            }
            AiSourceResponse copy = new AiSourceResponse();
            copy.setFile(safeValue(source.getFile()));
            copy.setSnippet(safeValue(source.getSnippet()));
            sanitized.add(copy);
        }
        return List.copyOf(sanitized);
    }

    private String normalizeRagAnalysis(String answer) {
        if (answer == null || answer.isBlank()) {
            return RAG_EMPTY_ANSWER_MESSAGE;
        }
        return answer.trim();
    }

    private String safeValue(String value) {
        if (value == null || value.isBlank()) {
            return "Non renseigne";
        }
        return value.trim();
    }

    private String safeEnum(Enum<?> value) {
        if (value == null) {
            return "NON_RENSEIGNE";
        }
        return value.name().toUpperCase(Locale.ROOT);
    }

    private long elapsedMs(long startedAtNanos) {
        return TimeUnit.NANOSECONDS.toMillis(Math.max(0, System.nanoTime() - startedAtNanos));
    }
}
