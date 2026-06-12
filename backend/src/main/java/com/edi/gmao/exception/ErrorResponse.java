package com.edi.gmao.exception;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.Collections;
import java.util.Map;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Enveloppe standard de reponse en cas d'erreur")
public class ErrorResponse {

    @Builder.Default
    @Schema(description = "Horodatage UTC de l'erreur", example = "2026-04-16T20:30:00Z")
    private Instant timestamp = Instant.now();
    @Schema(description = "Code HTTP numerique", example = "400")
    private int status;
    @Schema(description = "Libelle HTTP standard", example = "Bad Request")
    private String error;
    @Schema(description = "Message d'erreur lisible pour le frontend", example = "Validation failed for request body")
    private String message;
    @Schema(description = "Chemin HTTP de la requete", example = "/api/auth/login")
    private String path;
    @Builder.Default
    @Schema(description = "Details d'erreur par champ ou parametre")
    private Map<String, String> details = Collections.emptyMap();
}
