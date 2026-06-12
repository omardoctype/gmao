package com.edi.gmao.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.edi.gmao.dto.ai.AiAskRequest;
import com.edi.gmao.dto.ai.AiAskResponse;
import com.edi.gmao.dto.ai.AiSourceResponse;
import com.edi.gmao.dto.predictive.PredictiveRagAnalysisResponse;
import com.edi.gmao.dto.predictive.PredictiveRiskLevel;
import com.edi.gmao.dto.predictive.PredictiveRiskReason;
import com.edi.gmao.dto.predictive.PredictiveRiskResponse;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.exception.ApiException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class PredictiveRagAnalysisServiceTest {

    @Mock
    private PredictiveMaintenanceService predictiveMaintenanceService;
    @Mock
    private AiAssistantService aiAssistantService;

    private PredictiveRagAnalysisService predictiveRagAnalysisService;

    @BeforeEach
    void setUp() {
        predictiveRagAnalysisService = new PredictiveRagAnalysisService(
                predictiveMaintenanceService,
                aiAssistantService
        );
    }

    @Test
    void analyzeEquipmentRiskWithRag_shouldReturnCombinedResponseWhenAiIsAvailable() {
        PredictiveRiskResponse riskResponse = buildRiskResponse();

        AiSourceResponse source = new AiSourceResponse();
        source.setFile("manuel_presse_hydraulique_hp200.md");
        source.setSnippet("Verifier la ventilation du moteur.");

        AiAskResponse aiAskResponse = new AiAskResponse();
        aiAskResponse.setAnswer("### Diagnostic probable\nSurchauffe moteur due a une ventilation insuffisante.");
        aiAskResponse.setSources(List.of(source));

        when(predictiveMaintenanceService.getEquipmentRisk(1L)).thenReturn(riskResponse);
        when(aiAssistantService.ask(any(AiAskRequest.class))).thenReturn(aiAskResponse);

        PredictiveRagAnalysisResponse response = predictiveRagAnalysisService.analyzeEquipmentRiskWithRag(1L);

        assertEquals(1L, response.getEquipmentId());
        assertEquals("EQ-001", response.getEquipmentCode());
        assertEquals(82, response.getRiskScore());
        assertEquals(PredictiveRiskLevel.CRITICAL, response.getRiskLevel());
        assertEquals(2, response.getRiskReasons().size());
        assertTrue(response.getRiskReasons().get(0).contains("(+24 pts)"));
        assertTrue(response.getRagAnalysis().contains("Diagnostic probable"));
        assertEquals(1, response.getSources().size());
        assertEquals("manuel_presse_hydraulique_hp200.md", response.getSources().get(0).getFile());

        ArgumentCaptor<AiAskRequest> requestCaptor = ArgumentCaptor.forClass(AiAskRequest.class);
        when(aiAssistantService.ask(requestCaptor.capture())).thenReturn(aiAskResponse);
        predictiveRagAnalysisService.analyzeEquipmentRiskWithRag(1L);
        AiAskRequest capturedRequest = requestCaptor.getValue();
        assertEquals("EQ-001", capturedRequest.getEquipmentCode());
        assertTrue(capturedRequest.getQuestion().contains("Score de risque predictif : 82/100"));
        assertTrue(capturedRequest.getQuestion().contains("Raisons du risque"));
    }

    @Test
    void analyzeEquipmentRiskWithRag_shouldReturnRiskEvenWhenAiServiceIsUnavailable() {
        PredictiveRiskResponse riskResponse = buildRiskResponse();

        when(predictiveMaintenanceService.getEquipmentRisk(1L)).thenReturn(riskResponse);
        when(aiAssistantService.ask(any(AiAskRequest.class))).thenThrow(
                new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI unavailable")
        );

        PredictiveRagAnalysisResponse response = predictiveRagAnalysisService.analyzeEquipmentRiskWithRag(1L);

        assertEquals(82, response.getRiskScore());
        assertEquals(PredictiveRiskLevel.CRITICAL, response.getRiskLevel());
        assertTrue(response.getRagAnalysis().contains("Analyse RAG indisponible"));
        assertTrue(response.getSources().isEmpty());
    }

    private PredictiveRiskResponse buildRiskResponse() {
        return PredictiveRiskResponse.builder()
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .equipmentName("Presse hydraulique HP-200")
                .category("Hydraulique")
                .location("Atelier A")
                .criticality(EquipmentCriticality.CRITICAL)
                .status(EquipmentStatus.OUT_OF_SERVICE)
                .riskScore(82)
                .riskLevel(PredictiveRiskLevel.CRITICAL)
                .reasons(List.of(
                        PredictiveRiskReason.builder()
                                .criterion("CRITICALITY")
                                .detail("Criticite CRITICAL sur cet equipement.")
                                .points(24)
                                .build(),
                        PredictiveRiskReason.builder()
                                .criterion("BREAKDOWNS_LAST_90_DAYS")
                                .detail("5 panne(s) declaree(s) sur les 90 derniers jours.")
                                .points(24)
                                .build()
                ))
                .recommendedAction("Intervention urgente recommandee.")
                .build();
    }
}
