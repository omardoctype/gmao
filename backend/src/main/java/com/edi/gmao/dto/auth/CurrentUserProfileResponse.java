package com.edi.gmao.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Set;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Profil de l'utilisateur authentifie")
public class CurrentUserProfileResponse {

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

    @Schema(description = "Roles metier de l'utilisateur", example = "[\"ADMIN\", \"RESPONSABLE_MAINTENANCE\"]")
    private Set<String> roles;

    @Schema(
            description = "Permissions effectives de l'utilisateur (derivees des roles)",
            example = "[\"VIEW_DASHBOARD\", \"MANAGE_USERS\", \"CREATE_EQUIPMENT\"]"
    )
    private Set<String> permissions;
}
