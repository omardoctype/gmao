package com.edi.gmao.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload de connexion utilisateur")
public class LoginRequest {

    @NotBlank
    @Email
    @Size(max = 150)
    @Schema(description = "Email de connexion", example = "admin@gmao.com")
    private String email;

    @NotBlank
    @Size(min = 8, max = 255)
    @Schema(description = "Mot de passe utilisateur", example = "Admin123!")
    private String password;
}
