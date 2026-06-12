package com.edi.gmao.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Reponse d'authentification JWT")
public class AuthResponse {

    @Schema(description = "Jeton d'acces JWT", example = "eyJhbGciOiJIUzI1NiJ9...")
    private String accessToken;
    @Schema(description = "Type de jeton", example = "Bearer")
    private String tokenType;
    @Schema(description = "Duree de validite du jeton (ms)", example = "86400000")
    private long expiresIn;
    @Schema(description = "Informations du compte connecte")
    private AuthUserDto user;
}
