package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.auth.AuthResponse;
import com.edi.gmao.dto.auth.CurrentUserProfileResponse;
import com.edi.gmao.dto.auth.LoginRequest;
import com.edi.gmao.dto.auth.RegisterRequest;
import com.edi.gmao.service.AuthService;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Validated
@Tag(name = "Authentication", description = "Authentication and user registration endpoints")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(
            summary = "Register a new user account",
            description = "Cree un compte utilisateur et retourne un JWT immediatement."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Utilisateur cree avec succes"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Payload invalide",
                    content = @Content
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "Email deja utilise",
                    content = @Content
            )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<AuthResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("User registered successfully")
                .data(response)
                .build());
    }

    @PostMapping("/login")
    @Operation(
            summary = "Authenticate user and generate JWT token",
            description = "Authentifie un utilisateur via email/mot de passe et retourne un access token JWT."
    )
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            description = "Informations de connexion",
            content = @Content(
                    examples = @ExampleObject(
                            name = "Login Example",
                            value = """
                                    {
                                      "email": "admin@gmao.com",
                                      "password": "Admin123!"
                                    }
                                    """
                    )
            )
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Connexion reussie"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Payload invalide",
                    content = @Content
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Identifiants invalides",
                    content = @Content
            )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Login successful")
                .data(response)
                .build());
    }

    @GetMapping("/me")
    @Operation(
            summary = "Get current authenticated user profile",
            description = "Retourne le profil de l'utilisateur connecte en se basant sur le JWT.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Profil utilisateur retourne avec succes"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "JWT manquant, invalide ou utilisateur non authentifie",
                    content = @Content
            )
    })
    public ResponseEntity<ApiResponse<CurrentUserProfileResponse>> me(Authentication authentication) {
        String authenticatedEmail = authentication == null ? null : authentication.getName();
        CurrentUserProfileResponse response = authService.getCurrentUserProfile(authenticatedEmail);
        return ResponseEntity.ok(ApiResponse.<CurrentUserProfileResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Current user profile retrieved successfully")
                .data(response)
                .build());
    }
}
