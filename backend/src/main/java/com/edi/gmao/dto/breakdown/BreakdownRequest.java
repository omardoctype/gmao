package com.edi.gmao.dto.breakdown;

import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import com.edi.gmao.entity.BreakdownType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload de declaration/mise a jour d'une panne")
public class BreakdownRequest {

    @NotBlank
    @Size(max = 50)
    @Schema(description = "Reference unique de la panne", example = "BR-2026-001")
    private String reference;

    @NotBlank
    @Size(max = 200)
    @Schema(description = "Titre court", example = "Arret convoyeur ligne 2")
    private String title;

    @NotBlank
    @Size(max = 2000)
    @Schema(description = "Description detaillee", example = "Le moteur principal ne demarre plus.")
    private String description;

    @NotNull
    @Schema(description = "Type de panne", example = "MECHANICAL")
    private BreakdownType type;

    @NotNull
    @Schema(description = "Priorite de traitement", example = "HIGH")
    private BreakdownPriority priority;

    @NotNull
    @Schema(description = "Statut courant", example = "DECLARED")
    private BreakdownStatus status;

    @NotNull
    @Positive
    @Schema(description = "Identifiant equipement concerne", example = "12")
    private Long equipmentId;
}
