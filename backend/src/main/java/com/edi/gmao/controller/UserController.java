package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.user.UserCreateRequest;
import com.edi.gmao.dto.user.UserRolesUpdateRequest;
import com.edi.gmao.dto.user.UserResponse;
import com.edi.gmao.dto.user.UserUpdateRequest;
import com.edi.gmao.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Validated
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Users", description = "User management endpoints (ADMIN only)")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @Operation(
            summary = "Create user",
            description = "Cree un utilisateur avec mot de passe encode (BCrypt). Acces: ADMIN uniquement."
    )
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody UserCreateRequest request) {
        UserResponse createdUser = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<UserResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("User created successfully")
                .data(createdUser)
                .build());
    }

    @GetMapping
    @Operation(summary = "Get users", description = "Retourne la liste paginee des utilisateurs.")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> findAll(
            @ParameterObject
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<UserResponse> users = userService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<UserResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Users fetched successfully")
                .data(users)
                .build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by id")
    public ResponseEntity<ApiResponse<UserResponse>> findById(@PathVariable @Positive Long id) {
        UserResponse user = userService.findById(id);
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .status(HttpStatus.OK.value())
                .message("User fetched successfully")
                .data(user)
                .build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user by id")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        UserResponse updatedUser = userService.update(id, request);
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .status(HttpStatus.OK.value())
                .message("User updated successfully")
                .data(updatedUser)
                .build());
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @Operation(
            summary = "Replace user roles",
            description = "Remplace les roles existants d'un utilisateur par la liste fournie. Acces: ADMIN uniquement."
    )
    public ResponseEntity<ApiResponse<UserResponse>> updateRoles(
            @PathVariable @Positive Long id,
            @Valid @RequestBody UserRolesUpdateRequest request
    ) {
        UserResponse updatedUser = userService.updateRoles(id, request);
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .status(HttpStatus.OK.value())
                .message("User roles updated successfully")
                .data(updatedUser)
                .build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user by id")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable @Positive Long id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(HttpStatus.OK.value())
                .message("User deleted successfully")
                .data(null)
                .build());
    }
}
