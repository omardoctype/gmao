package com.edi.gmao.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Set;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Informations utilisateur exposees apres connexion")
public class AuthUserDto {

    @Schema(description = "Identifiant utilisateur", example = "1")
    private Long id;
    @Schema(description = "Prenom", example = "Admin")
    private String firstName;
    @Schema(description = "Nom", example = "System")
    private String lastName;
    @Schema(description = "Email", example = "admin@gmao.com")
    private String email;
    @Schema(description = "Telephone", example = "+21620123456")
    private String phone;
    @Schema(description = "Compte actif ou non", example = "true")
    private boolean active;
    @Schema(description = "Roles techniques (prefixes ROLE_ en backend)", example = "[\"ROLE_ADMIN\"]")
    private Set<String> roles;
}
