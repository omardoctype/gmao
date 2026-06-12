package com.edi.gmao.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload d'inscription utilisateur")
public class RegisterRequest {

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Prenom", example = "Admin")
    private String firstName;

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Nom", example = "System")
    private String lastName;

    @NotBlank
    @Email
    @Size(max = 150)
    @Schema(description = "Email unique", example = "admin@gmao.com")
    private String email;

    @NotBlank
    @Size(min = 8, max = 255)
    @Schema(description = "Mot de passe (8 caracteres min.)", example = "Admin123!")
    private String password;

    @Size(max = 30)
    @Schema(description = "Numero de telephone", example = "+21620123456")
    private String phone;

    @Schema(description = "Roles a affecter (optionnel)", example = "[\"ADMIN\"]")
    private Set<String> roles = new HashSet<>();
}
