package com.edi.gmao.dto.workorder;

import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload de creation/mise a jour d'un ordre de travail")
public class WorkOrderRequest {

    @NotBlank
    @Size(max = 50)
    @Schema(description = "Reference unique de l'ordre de travail", example = "OT-2026-010")
    private String reference;

    @NotNull
    @Schema(description = "Type d'ordre", example = "CORRECTIVE")
    private WorkOrderType type;

    @Schema(description = "Statut (optionnel a la creation)", example = "CREATED")
    private WorkOrderStatus status;

    @NotNull
    @Schema(description = "Priorite metier", example = "HIGH")
    private WorkOrderPriority priority;

    @Schema(description = "Date/heure planifiee", example = "2026-04-20T09:00:00")
    private LocalDateTime plannedDate;

    @DecimalMin(value = "0.0", inclusive = true)
    @Schema(description = "Cout estime", example = "150.00")
    private BigDecimal estimatedCost;

    @DecimalMin(value = "0.0", inclusive = true)
    @Schema(description = "Cout reel", example = "170.50")
    private BigDecimal realCost;

    @NotBlank
    @Size(max = 2000)
    @Schema(description = "Description de l'intervention", example = "Remplacement courroie et test complet.")
    private String description;

    @NotNull
    @Positive
    @Schema(description = "Identifiant equipement", example = "5")
    private Long equipmentId;

    @Positive
    @Schema(description = "Identifiant panne liee (optionnel)", example = "21")
    private Long breakdownId;
}
