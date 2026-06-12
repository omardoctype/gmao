package com.edi.gmao.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload de remplacement des roles d'un utilisateur")
public class UserRolesUpdateRequest {

    @NotEmpty
    @Schema(description = "Liste des roles a affecter", example = "[\"TECHNICIAN\", \"OPERATOR\"]")
    private Set<@NotBlank @Size(max = 50) String> roles = new HashSet<>();
}
