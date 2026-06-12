package com.edi.gmao.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.Set;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Representation d'un utilisateur")
public class UserResponse {

    @Schema(example = "1")
    private Long id;

    @Schema(example = "Meriem")
    private String firstName;

    @Schema(example = "Khaled")
    private String lastName;

    @Schema(example = "meriem.khaled@gmao.com")
    private String email;

    @Schema(example = "+21620123456")
    private String phone;

    @Schema(example = "true")
    private boolean active;

    @Schema(example = "2026-04-20T11:30:00")
    private LocalDateTime createdAt;

    @Schema(example = "[\"TECHNICIAN\",\"OPERATOR\"]")
    private Set<String> roles;
}
