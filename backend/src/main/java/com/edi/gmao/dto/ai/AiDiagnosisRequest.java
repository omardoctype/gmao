package com.edi.gmao.dto.ai;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload de diagnostic de panne vers l'assistant IA")
public class AiDiagnosisRequest {

    @NotBlank
    @Size(max = 50)
    @Schema(description = "Code equipement", example = "EQ-001")
    private String equipmentCode;

    @NotBlank
    @Size(max = 5000)
    @Schema(description = "Description de la panne", example = "Le moteur chauffe apres 20 minutes de fonctionnement.")
    private String breakdownDescription;
}
