package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.breakdown.BreakdownRequest;
import com.edi.gmao.dto.breakdown.BreakdownResponse;
import com.edi.gmao.dto.breakdown.BreakdownStatusUpdateRequest;
import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import com.edi.gmao.entity.BreakdownType;
import com.edi.gmao.service.BreakdownService;
import org.springdoc.core.annotations.ParameterObject;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/breakdowns")
@Validated
@Tag(name = "Breakdowns", description = "Breakdown declaration and management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class BreakdownController {

    private final BreakdownService breakdownService;

    public BreakdownController(BreakdownService breakdownService) {
        this.breakdownService = breakdownService;
    }

    @PostMapping
    @PreAuthorize("hasRole('OPERATOR')")
    @Operation(
            summary = "Declare a new breakdown",
            description = "Declare une panne sur un equipement. Acces: OPERATOR."
    )
    public ResponseEntity<ApiResponse<BreakdownResponse>> create(@Valid @RequestBody BreakdownRequest request) {
        BreakdownResponse created = breakdownService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<BreakdownResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("Breakdown created successfully")
                .data(created)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(summary = "Get all breakdowns")
    public ResponseEntity<ApiResponse<PagedResponse<BreakdownResponse>>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BreakdownStatus status,
            @RequestParam(required = false) BreakdownPriority priority,
            @RequestParam(required = false) BreakdownType type,
            @ParameterObject
            @PageableDefault(size = 20, sort = "declaredAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<BreakdownResponse> breakdowns = breakdownService.findAll(
                search,
                status,
                priority,
                type,
                pageable
        );
        return ResponseEntity.ok(ApiResponse.<PagedResponse<BreakdownResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Breakdowns fetched successfully")
                .data(breakdowns)
                .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(summary = "Get breakdown by id")
    public ResponseEntity<ApiResponse<BreakdownResponse>> findById(@PathVariable @Positive Long id) {
        BreakdownResponse breakdown = breakdownService.findById(id);
        return ResponseEntity.ok(ApiResponse.<BreakdownResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Breakdown fetched successfully")
                .data(breakdown)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RESPONSABLE_MAINTENANCE')")
    @Operation(summary = "Update breakdown")
    public ResponseEntity<ApiResponse<BreakdownResponse>> update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody BreakdownRequest request
    ) {
        BreakdownResponse updated = breakdownService.update(id, request);
        return ResponseEntity.ok(ApiResponse.<BreakdownResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Breakdown updated successfully")
                .data(updated)
                .build());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('RESPONSABLE_MAINTENANCE')")
    @Operation(
            summary = "Update breakdown status",
            description = "Met a jour uniquement le statut d'une panne. Acces: RESPONSABLE_MAINTENANCE."
    )
    public ResponseEntity<ApiResponse<BreakdownResponse>> patchStatus(
            @PathVariable @Positive Long id,
            @Valid @RequestBody BreakdownStatusUpdateRequest request
    ) {
        BreakdownResponse updated = breakdownService.patchStatus(id, request);
        return ResponseEntity.ok(ApiResponse.<BreakdownResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Breakdown status updated successfully")
                .data(updated)
                .build());
    }
}
