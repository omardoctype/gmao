package com.edi.gmao.dto.workorder;

import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Representation d'un ordre de travail")
public class WorkOrderResponse {

    @Schema(example = "25")
    private Long id;
    @Schema(example = "OT-2026-010")
    private String reference;
    private WorkOrderType type;
    private WorkOrderStatus status;
    private WorkOrderPriority priority;
    private LocalDateTime createdAt;
    private LocalDateTime plannedDate;
    private LocalDateTime assignedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer estimatedDurationMinutes;
    private Integer actualDurationMinutes;
    private BigDecimal estimatedCost;
    private BigDecimal realCost;
    private String description;
    private Long equipmentId;
    private String equipmentCode;
    private String equipmentName;
    private Long breakdownId;
    private String breakdownReference;
    private Long assignedTechnicianId;
    private String assignedTechnicianName;
}
