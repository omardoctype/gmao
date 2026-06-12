package com.edi.gmao.dto.interventionreport;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload de cloture d'un OT avec rapport d'intervention")
public class InterventionReportRequest {

    @NotBlank
    @Size(max = 10000)
    @Schema(description = "Travaux effectivement realises", example = "Demontage carter, controle roulements, remplacement courroie.")
    private String performedTasks;

    @Size(max = 10000)
    @Schema(description = "Diagnostic reel constate", example = "Surchauffe liee a une tension courroie excessive.")
    private String realDiagnosis;

    @Size(max = 10000)
    @Schema(description = "Cause racine si connue", example = "Defaut d'alignement apres intervention precedente.")
    private String rootCause;

    @Size(max = 10000)
    @Schema(description = "Pieces utilisees", example = "Courroie B-52, graisse haute temperature.")
    private String usedParts;

    @PositiveOrZero
    @Schema(description = "Duree de l'intervention en minutes", example = "90")
    private Integer interventionDurationMinutes;

    @NotBlank
    @Size(max = 10000)
    @Schema(description = "Resultat final de l'intervention", example = "Equipement remis en service apres test a vide et en charge.")
    private String finalResult;

    @Size(max = 10000)
    @Schema(description = "Recommandations futures", example = "Planifier un controle vibration sous 7 jours.")
    private String futureRecommendations;
}
