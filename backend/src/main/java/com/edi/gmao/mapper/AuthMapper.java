package com.edi.gmao.mapper;

import com.edi.gmao.dto.auth.AuthResponse;
import com.edi.gmao.dto.auth.AuthUserDto;
import com.edi.gmao.dto.auth.CurrentUserProfileResponse;
import com.edi.gmao.entity.Permission;
import com.edi.gmao.entity.Role;
import com.edi.gmao.entity.User;
import com.edi.gmao.security.JwtProperties;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    private final JwtProperties jwtProperties;

    public AuthMapper(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public AuthResponse toAuthResponse(User user, String accessToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getExpirationMs())
                .user(toAuthUserDto(user))
                .build();
    }

    public CurrentUserProfileResponse toCurrentUserProfileResponse(User user) {
        return CurrentUserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roles(extractRoleNames(user))
                .permissions(extractPermissionNames(user))
                .build();
    }

    private AuthUserDto toAuthUserDto(User user) {
        return AuthUserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .active(user.isActive())
                .roles(extractRoleNames(user))
                .build();
    }

    private Set<String> extractRoleNames(User user) {
        return user.getRoles().stream()
                .map(Role::getName)
                .filter(Objects::nonNull)
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<String> extractPermissionNames(User user) {
        return user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getName)
                .filter(Objects::nonNull)
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
