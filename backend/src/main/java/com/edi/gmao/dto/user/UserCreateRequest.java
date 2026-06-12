package com.edi.gmao.dto.user;

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
@Schema(description = "Payload de creation d'un utilisateur")
public class UserCreateRequest {

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Prenom", example = "Meriem")
    private String firstName;

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Nom", example = "Khaled")
    private String lastName;

    @NotBlank
    @Email
    @Size(max = 150)
    @Schema(description = "Email unique", example = "meriem.khaled@gmao.com")
    private String email;

    @NotBlank
    @Size(min = 8, max = 255)
    @Schema(description = "Mot de passe en clair (sera encode en BCrypt)", example = "StrongPwd123!")
    private String password;

    @Size(max = 30)
    @Schema(description = "Telephone", example = "+21620123456")
    private String phone;

    @Schema(description = "Utilisateur actif ou non", example = "true")
    private Boolean active = Boolean.TRUE;

    @Schema(description = "Liste des roles (optionnelle, OPERATOR par defaut)", example = "[\"OPERATOR\"]")
    private Set<@NotBlank @Size(max = 50) String> roles = new HashSet<>();
}
