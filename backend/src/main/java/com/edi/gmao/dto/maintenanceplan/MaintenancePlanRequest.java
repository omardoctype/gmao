package com.edi.gmao.dto.maintenanceplan;

import com.edi.gmao.entity.MaintenancePlanFrequency;
import com.edi.gmao.entity.MaintenancePlanType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload de creation/mise a jour d'un plan de maintenance")
public class MaintenancePlanRequest {

    @NotNull
    @Schema(description = "Type de plan", example = "PREVENTIVE")
    private MaintenancePlanType type;

    @NotNull
    @Schema(description = "Frequence d'execution", example = "MONTHLY")
    private MaintenancePlanFrequency frequency;

    @NotNull
    @FutureOrPresent
    @Schema(description = "Prochaine date d'execution", example = "2026-05-01")
    private LocalDate nextExecutionDate;

    @NotBlank
    @Size(max = 2000)
    @Schema(description = "Description du plan", example = "Controle mensuel des filtres et lubrification.")
    private String description;

    @NotNull
    @Positive
    @Schema(description = "Identifiant equipement associe", example = "8")
    private Long equipmentId;
}
