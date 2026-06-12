package com.edi.gmao.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Enveloppe standard de reponse en cas de succes")
public class ApiResponse<T> {

    @Builder.Default
    @Schema(description = "Horodatage UTC de la reponse", example = "2026-04-16T20:30:00Z")
    private Instant timestamp = Instant.now();
    @Schema(description = "Code HTTP numerique", example = "200")
    private int status;
    @Schema(description = "Message fonctionnel lisible", example = "Operation completed successfully")
    private String message;
    @Schema(description = "Donnees metier renvoyees par l'endpoint")
    private T data;
}
