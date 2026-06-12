package com.edi.gmao.service;

import com.edi.gmao.dto.auth.AuthResponse;
import com.edi.gmao.dto.auth.CurrentUserProfileResponse;
import com.edi.gmao.dto.auth.LoginRequest;
import com.edi.gmao.dto.auth.RegisterRequest;
import com.edi.gmao.entity.Role;
import com.edi.gmao.entity.User;
import com.edi.gmao.exception.ApiException;
import com.edi.gmao.mapper.AuthMapper;
import com.edi.gmao.repository.RoleRepository;
import com.edi.gmao.repository.UserRepository;
import com.edi.gmao.security.JwtService;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String DEFAULT_ROLE = "OPERATOR";
    private static final List<String> ALLOWED_ROLES = Arrays.asList(
            "ADMIN",
            "RESPONSABLE_MAINTENANCE",
            "TECHNICIAN",
            "STOREKEEPER",
            "OPERATOR",
            "DIRECTION"
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuthMapper authMapper;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            AuthMapper authMapper
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.authMapper = authMapper;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already in use");
        }

        Set<Role> roles = resolveRoles(request.getRoles());

        User user = new User();
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone() == null ? null : request.getPhone().trim());
        user.setActive(true);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(savedUser.getEmail())
                .password(savedUser.getPassword())
                .authorities(savedUser.getRoles().stream()
                        .map(Role::getName)
                        .map(this::toAuthority)
                        .toArray(String[]::new))
                .accountLocked(false)
                .disabled(!savedUser.isActive())
                .build();

        String token = jwtService.generateToken(userDetails);
        return authMapper.toAuthResponse(savedUser, token);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );

            UserDetails principal = (UserDetails) authentication.getPrincipal();
            String token = jwtService.generateToken(principal);
            User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

            return authMapper.toAuthResponse(user, token);
        } catch (AuthenticationException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
    }

    @Transactional(readOnly = true)
    public CurrentUserProfileResponse getCurrentUserProfile(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user is invalid");
        }

        User user = userRepository.findProfileByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        return authMapper.toCurrentUserProfileResponse(user);
    }

    private Set<Role> resolveRoles(Set<String> requestedRoles) {
        if (requestedRoles == null || requestedRoles.isEmpty()) {
            Set<Role> defaultRoles = roleRepository.findByNameIn(Set.of(DEFAULT_ROLE))
                    .stream()
                    .collect(Collectors.toSet());
            if (defaultRoles.isEmpty()) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Default role is not configured");
            }
            return defaultRoles;
        }

        Set<String> normalizedRoles = requestedRoles.stream()
                .filter(role -> role != null && !role.isBlank())
                .map(role -> role.trim().toUpperCase(Locale.ROOT))
                .collect(Collectors.toSet());

        if (normalizedRoles.isEmpty()) {
            return resolveRoles(null);
        }

        boolean hasInvalidRole = normalizedRoles.stream().anyMatch(role -> !ALLOWED_ROLES.contains(role));
        if (hasInvalidRole) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "One or more roles are invalid");
        }

        Set<Role> roles = roleRepository.findByNameIn(normalizedRoles).stream().collect(Collectors.toSet());
        if (roles.size() != normalizedRoles.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Some roles are not configured in database");
        }
        return roles;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String toAuthority(String roleName) {
        return roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
    }
}
