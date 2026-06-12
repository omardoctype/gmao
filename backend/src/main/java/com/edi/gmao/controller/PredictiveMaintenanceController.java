package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.predictive.PredictiveDashboardResponse;
import com.edi.gmao.dto.predictive.PredictiveRagAnalysisResponse;
import com.edi.gmao.dto.predictive.PredictiveRiskResponse;
import com.edi.gmao.service.PredictiveMaintenanceService;
import com.edi.gmao.service.PredictiveRagAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/predictive")
@Validated
@PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','DIRECTION','TECHNICIAN')")
@Tag(name = "Predictive Maintenance", description = "Rule-based predictive maintenance risk scoring")
@SecurityRequirement(name = "bearerAuth")
public class PredictiveMaintenanceController {

    private static final Logger log = LoggerFactory.getLogger(PredictiveMaintenanceController.class);

    private final PredictiveMaintenanceService predictiveMaintenanceService;
    private final PredictiveRagAnalysisService predictiveRagAnalysisService;

    public PredictiveMaintenanceController(
            PredictiveMaintenanceService predictiveMaintenanceService,
            PredictiveRagAnalysisService predictiveRagAnalysisService
    ) {
        this.predictiveMaintenanceService = predictiveMaintenanceService;
        this.predictiveRagAnalysisService = predictiveRagAnalysisService;
    }

    @GetMapping("/equipments/risk")
    @Operation(summary = "Get predictive risk scoring for all equipments")
    public ResponseEntity<ApiResponse<List<PredictiveRiskResponse>>> getEquipmentsRisk() {
        List<PredictiveRiskResponse> risks = predictiveMaintenanceService.getEquipmentsRisk();
        return ResponseEntity.ok(ApiResponse.<List<PredictiveRiskResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Predictive risk list fetched successfully")
                .data(risks)
                .build());
    }

    @GetMapping("/equipments/{equipmentId}/risk")
    @Operation(summary = "Get predictive risk scoring detail for one equipment")
    public ResponseEntity<ApiResponse<PredictiveRiskResponse>> getEquipmentRisk(
            @PathVariable @Positive Long equipmentId
    ) {
        PredictiveRiskResponse risk = predictiveMaintenanceService.getEquipmentRisk(equipmentId);
        return ResponseEntity.ok(ApiResponse.<PredictiveRiskResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Predictive risk detail fetched successfully")
                .data(risk)
                .build());
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get predictive maintenance dashboard indicators")
    public ResponseEntity<ApiResponse<PredictiveDashboardResponse>> getPredictiveDashboard() {
        PredictiveDashboardResponse dashboard = predictiveMaintenanceService.getDashboard();
        return ResponseEntity.ok(ApiResponse.<PredictiveDashboardResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Predictive dashboard fetched successfully")
                .data(dashboard)
                .build());
    }

    @PostMapping("/equipments/{equipmentId}/rag-analysis")
    @Operation(summary = "Get predictive risk and contextual RAG analysis for one equipment")
    public ResponseEntity<ApiResponse<PredictiveRagAnalysisResponse>> getEquipmentRagAnalysis(
            @PathVariable @Positive Long equipmentId
    ) {
        long startedAt = System.nanoTime();
        try {
            PredictiveRagAnalysisResponse analysis = predictiveRagAnalysisService.analyzeEquipmentRiskWithRag(equipmentId);
            return ResponseEntity.ok(ApiResponse.<PredictiveRagAnalysisResponse>builder()
                    .status(HttpStatus.OK.value())
                    .message("Predictive RAG analysis fetched successfully")
                    .data(analysis)
                    .build());
        } finally {
            long totalMs = TimeUnit.NANOSECONDS.toMillis(Math.max(0, System.nanoTime() - startedAt));
            log.info("Predictive RAG endpoint timing path=/api/predictive/equipments/{}/rag-analysis totalMs={}", equipmentId, totalMs);
        }
    }
}
