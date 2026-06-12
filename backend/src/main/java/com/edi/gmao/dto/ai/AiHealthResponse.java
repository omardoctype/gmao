package com.edi.gmao.dto.ai;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Etat de sante du service IA")
public class AiHealthResponse {

    @Schema(example = "UP")
    private String status;

    @Schema(example = "gmao-ai-service")
    private String service;

    @Schema(example = "qwen2.5:1.5b")
    private String model;
}
