package com.edi.gmao.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.edi.gmao.dto.ai.AiSourceResponse;
import com.edi.gmao.dto.predictive.PredictiveDashboardResponse;
import com.edi.gmao.dto.predictive.PredictiveRagAnalysisResponse;
import com.edi.gmao.dto.predictive.PredictiveRiskLevel;
import com.edi.gmao.dto.predictive.PredictiveRiskReason;
import com.edi.gmao.dto.predictive.PredictiveRiskResponse;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.security.JwtAuthenticationFilter;
import com.edi.gmao.service.PredictiveMaintenanceService;
import com.edi.gmao.service.PredictiveRagAnalysisService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = PredictiveMaintenanceController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthenticationFilter.class
        )
)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class PredictiveMaintenanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PredictiveMaintenanceService predictiveMaintenanceService;

    @MockBean
    private PredictiveRagAnalysisService predictiveRagAnalysisService;

    @Test
    void getEquipmentsRisk_shouldReturnRiskList() throws Exception {
        PredictiveRiskResponse response = buildRiskResponse(11L, "EQ-011", 84, PredictiveRiskLevel.CRITICAL);
        when(predictiveMaintenanceService.getEquipmentsRisk()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/predictive/equipments/risk"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Predictive risk list fetched successfully"))
                .andExpect(jsonPath("$.data[0].equipmentId").value(11))
                .andExpect(jsonPath("$.data[0].riskLevel").value("CRITICAL"));
    }

    @Test
    void getEquipmentRisk_shouldReturnRiskDetail() throws Exception {
        PredictiveRiskResponse response = buildRiskResponse(3L, "EQ-003", 62, PredictiveRiskLevel.HIGH);
        when(predictiveMaintenanceService.getEquipmentRisk(3L)).thenReturn(response);

        mockMvc.perform(get("/api/predictive/equipments/3/risk"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Predictive risk detail fetched successfully"))
                .andExpect(jsonPath("$.data.equipmentCode").value("EQ-003"))
                .andExpect(jsonPath("$.data.riskScore").value(62));
    }

    @Test
    void getPredictiveDashboard_shouldReturnDashboardIndicators() throws Exception {
        PredictiveRiskResponse topRisk = buildRiskResponse(19L, "EQ-019", 91, PredictiveRiskLevel.CRITICAL);
        PredictiveDashboardResponse dashboard = PredictiveDashboardResponse.builder()
                .lowCount(4)
                .mediumCount(3)
                .highCount(2)
                .criticalCount(1)
                .averageRiskScore(39.2)
                .topRiskEquipments(List.of(topRisk))
                .build();
        when(predictiveMaintenanceService.getDashboard()).thenReturn(dashboard);

        mockMvc.perform(get("/api/predictive/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Predictive dashboard fetched successfully"))
                .andExpect(jsonPath("$.data.criticalCount").value(1))
                .andExpect(jsonPath("$.data.topRiskEquipments[0].equipmentCode").value("EQ-019"));
    }

    @Test
    void getEquipmentRagAnalysis_shouldReturnCombinedPayload() throws Exception {
        AiSourceResponse source = new AiSourceResponse();
        source.setFile("manuel_presse_hydraulique_hp200.md");
        source.setSnippet("Verifier les circuits de refroidissement.");

        PredictiveRagAnalysisResponse response = PredictiveRagAnalysisResponse.builder()
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .equipmentName("Presse hydraulique HP-200")
                .riskScore(82)
                .riskLevel(PredictiveRiskLevel.CRITICAL)
                .riskReasons(List.of(
                        "Criticite CRITICAL sur cet equipement. (+24 pts)",
                        "5 panne(s) declaree(s) sur les 90 derniers jours. (+24 pts)"
                ))
                .predictiveRecommendedAction("Intervention urgente recommandee.")
                .ragAnalysis("### Diagnostic probable\nSurchauffe moteur probable.")
                .sources(List.of(source))
                .build();

        when(predictiveRagAnalysisService.analyzeEquipmentRiskWithRag(1L)).thenReturn(response);

        mockMvc.perform(post("/api/predictive/equipments/1/rag-analysis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Predictive RAG analysis fetched successfully"))
                .andExpect(jsonPath("$.data.equipmentCode").value("EQ-001"))
                .andExpect(jsonPath("$.data.riskLevel").value("CRITICAL"))
                .andExpect(jsonPath("$.data.sources[0].file").value("manuel_presse_hydraulique_hp200.md"));
    }

    private PredictiveRiskResponse buildRiskResponse(Long equipmentId, String equipmentCode, int score, PredictiveRiskLevel level) {
        return PredictiveRiskResponse.builder()
                .equipmentId(equipmentId)
                .equipmentCode(equipmentCode)
                .equipmentName("Test Equipment")
                .category("Production")
                .location("Zone A")
                .criticality(EquipmentCriticality.HIGH)
                .status(EquipmentStatus.MAINTENANCE)
                .riskScore(score)
                .riskLevel(level)
                .recommendedAction("Intervention urgente recommandee.")
                .reasons(List.of(
                        PredictiveRiskReason.builder()
                                .criterion("TEST_RULE")
                                .detail("Raison de test")
                                .points(12)
                                .build()
                ))
                .build();
    }
}
