package com.edi.gmao.dto.ai;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Source documentaire utilisee par l'assistant IA")
public class AiSourceResponse {

    @Schema(description = "Nom du fichier source", example = "procedure_surchauffe_moteur.md")
    private String file;

    @Schema(description = "Extrait du fichier source")
    private String snippet;
}
