package com.edi.gmao.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload de mise a jour d'un utilisateur")
public class UserUpdateRequest {

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

    @Size(min = 8, max = 255)
    @Schema(description = "Nouveau mot de passe (optionnel, encode en BCrypt si renseigne)", example = "NewStrongPwd123!")
    private String password;

    @Size(max = 30)
    @Schema(description = "Telephone", example = "+21620123456")
    private String phone;

    @NotNull
    @Schema(description = "Utilisateur actif ou non", example = "true")
    private Boolean active;

    @NotEmpty
    @Schema(description = "Liste des roles", example = "[\"TECHNICIAN\",\"OPERATOR\"]")
    private Set<@NotBlank @Size(max = 50) String> roles = new HashSet<>();
}
