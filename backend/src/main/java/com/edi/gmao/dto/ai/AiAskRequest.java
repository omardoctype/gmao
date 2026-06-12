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
@Schema(description = "Payload de question vers l'assistant IA")
public class AiAskRequest {

    @NotBlank
    @Size(max = 3000)
    @Schema(description = "Question utilisateur", example = "Que faire en cas de fuite hydraulique sur EQ-001 ?")
    private String question;

    @Size(max = 50)
    @Schema(description = "Code equipement optionnel", example = "EQ-001")
    private String equipmentCode;
}
