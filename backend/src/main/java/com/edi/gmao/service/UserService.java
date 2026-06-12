package com.edi.gmao.service;

import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.PagedResponseMapper;
import com.edi.gmao.dto.user.UserCreateRequest;
import com.edi.gmao.dto.user.UserRolesUpdateRequest;
import com.edi.gmao.dto.user.UserResponse;
import com.edi.gmao.dto.user.UserUpdateRequest;
import com.edi.gmao.entity.Role;
import com.edi.gmao.entity.User;
import com.edi.gmao.exception.ApiException;
import com.edi.gmao.exception.UserEmailConflictException;
import com.edi.gmao.exception.UserNotFoundException;
import com.edi.gmao.mapper.UserMapper;
import com.edi.gmao.repository.RoleRepository;
import com.edi.gmao.repository.UserRepository;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final String DEFAULT_ROLE = "OPERATOR";
    private static final Set<String> ALLOWED_ROLES = Set.of(
            "ADMIN",
            "RESPONSABLE_MAINTENANCE",
            "TECHNICIAN",
            "STOREKEEPER",
            "OPERATOR",
            "DIRECTION"
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserMapper userMapper,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        ensureEmailIsUnique(normalizedEmail, null);

        User user = userMapper.toEntity(request);
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRoles(resolveRoles(request.getRoles(), true));

        User savedUser = userRepository.save(user);
        auditLogService.record(
                "USER_CREATED",
                "USER",
                savedUser.getId(),
                "User " + savedUser.getEmail() + " created"
        );
        return userMapper.toResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> findAll(Pageable pageable) {
        Page<UserResponse> page = userRepository.findAll(pageable)
                .map(userMapper::toResponse);
        return PagedResponseMapper.fromPage(page);
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return userMapper.toResponse(getUserOrThrow(id));
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request) {
        User existingUser = getUserOrThrow(id);
        String normalizedEmail = normalizeEmail(request.getEmail());
        ensureEmailIsUnique(normalizedEmail, id);

        userMapper.applyUpdateRequest(request, existingUser);
        existingUser.setEmail(normalizedEmail);

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        existingUser.setRoles(resolveRoles(request.getRoles(), false));
        User savedUser = userRepository.save(existingUser);
        auditLogService.record(
                "USER_UPDATED",
                "USER",
                savedUser.getId(),
                "User " + savedUser.getEmail() + " updated"
        );
        return userMapper.toResponse(savedUser);
    }

    @Transactional
    public UserResponse updateRoles(Long id, UserRolesUpdateRequest request) {
        User existingUser = getUserOrThrow(id);
        existingUser.setRoles(resolveRoles(request.getRoles(), false));

        User savedUser = userRepository.save(existingUser);
        auditLogService.record(
                "USER_ROLES_UPDATED",
                "USER",
                savedUser.getId(),
                "Roles updated for user " + savedUser.getEmail()
        );
        return userMapper.toResponse(savedUser);
    }

    @Transactional
    public void delete(Long id) {
        User user = getUserOrThrow(id);
        userRepository.delete(user);
        auditLogService.record(
                "USER_DELETED",
                "USER",
                user.getId(),
                "User " + user.getEmail() + " deleted"
        );
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    private void ensureEmailIsUnique(String email, Long currentUserId) {
        userRepository.findByEmailIgnoreCase(email)
                .filter(existingUser -> currentUserId == null || !existingUser.getId().equals(currentUserId))
                .ifPresent(existingUser -> {
                    throw new UserEmailConflictException(email);
                });
    }

    private Set<Role> resolveRoles(Set<String> requestedRoles, boolean allowDefaultRole) {
        if (requestedRoles == null || requestedRoles.isEmpty()) {
            if (!allowDefaultRole) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "At least one role is required");
            }
            return resolveRoles(Set.of(DEFAULT_ROLE), false);
        }

        Set<String> normalizedRoles = requestedRoles.stream()
                .filter(roleName -> roleName != null && !roleName.isBlank())
                .map(roleName -> roleName.trim().toUpperCase(Locale.ROOT))
                .collect(Collectors.toSet());

        if (normalizedRoles.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least one role is required");
        }

        boolean hasInvalidRole = normalizedRoles.stream().anyMatch(roleName -> !ALLOWED_ROLES.contains(roleName));
        if (hasInvalidRole) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "One or more roles are invalid");
        }

        Set<Role> resolvedRoles = new HashSet<>(roleRepository.findByNameIn(normalizedRoles));
        if (resolvedRoles.size() != normalizedRoles.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Some roles are not configured in database");
        }
        return resolvedRoles;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
