package com.edi.gmao.dto.interventionreport;

import com.edi.gmao.dto.equipmentdocument.EquipmentDocumentResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Rapport d'intervention genere a la cloture d'un OT")
public class InterventionReportResponse {

    @Schema(example = "12")
    private Long id;
    private Long workOrderId;
    private String workOrderReference;
    private Long equipmentId;
    private String equipmentCode;
    private String equipmentName;
    private Long breakdownId;
    private String breakdownReference;
    private Long technicianId;
    private String technicianName;
    private String performedTasks;
    private String realDiagnosis;
    private String rootCause;
    private String usedParts;
    private Integer interventionDurationMinutes;
    private String finalResult;
    private String futureRecommendations;
    private LocalDateTime createdAt;
    private LocalDateTime closedAt;
    private EquipmentDocumentResponse equipmentDocument;
}
