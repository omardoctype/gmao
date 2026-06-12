package com.edi.gmao.dto.ai;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Reponse de diagnostic de l'assistant IA")
public class AiDiagnosisResponse {

    @Schema(description = "Diagnostic textuel")
    private String diagnosis;

    @Schema(description = "Actions recommandees")
    private List<String> recommendedActions = new ArrayList<>();

    @Schema(description = "Sources documentaires utilisees")
    private List<AiSourceResponse> sources = new ArrayList<>();
}
