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
@Schema(description = "Reponse de l'assistant IA pour une question")
public class AiAskResponse {

    @Schema(description = "Reponse textuelle de l'assistant")
    private String answer;

    @Schema(description = "Sources documentaires utilisees")
    private List<AiSourceResponse> sources = new ArrayList<>();
}
