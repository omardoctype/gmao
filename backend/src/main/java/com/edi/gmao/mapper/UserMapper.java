package com.edi.gmao.mapper;

import com.edi.gmao.dto.user.UserCreateRequest;
import com.edi.gmao.dto.user.UserResponse;
import com.edi.gmao.dto.user.UserUpdateRequest;
import com.edi.gmao.entity.Role;
import com.edi.gmao.entity.User;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(UserCreateRequest request) {
        User user = new User();
        user.setFirstName(trim(request.getFirstName()));
        user.setLastName(trim(request.getLastName()));
        user.setEmail(trim(request.getEmail()));
        user.setPhone(trim(request.getPhone()));
        user.setActive(request.getActive() == null || request.getActive());
        return user;
    }

    public void applyUpdateRequest(UserUpdateRequest request, User user) {
        user.setFirstName(trim(request.getFirstName()));
        user.setLastName(trim(request.getLastName()));
        user.setEmail(trim(request.getEmail()));
        user.setPhone(trim(request.getPhone()));
        user.setActive(Boolean.TRUE.equals(request.getActive()));
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .roles(extractRoleNames(user))
                .build();
    }

    private Set<String> extractRoleNames(User user) {
        return user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toCollection(TreeSet::new));
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
