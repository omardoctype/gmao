package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.maintenanceplan.MaintenancePlanRequest;
import com.edi.gmao.dto.maintenanceplan.MaintenancePlanResponse;
import com.edi.gmao.entity.MaintenancePlanFrequency;
import com.edi.gmao.entity.MaintenancePlanType;
import com.edi.gmao.service.MaintenancePlanService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/maintenance-plans")
@Validated
@Tag(name = "Maintenance Plans", description = "Preventive maintenance plan management")
@SecurityRequirement(name = "bearerAuth")
public class MaintenancePlanController {

    private final MaintenancePlanService maintenancePlanService;

    public MaintenancePlanController(MaintenancePlanService maintenancePlanService) {
        this.maintenancePlanService = maintenancePlanService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(
            summary = "Create a maintenance plan",
            description = "Cree un plan de maintenance preventif. Acces: ADMIN, RESPONSABLE_MAINTENANCE."
    )
    public ResponseEntity<ApiResponse<MaintenancePlanResponse>> create(
            @Valid @RequestBody MaintenancePlanRequest request
    ) {
        MaintenancePlanResponse created = maintenancePlanService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<MaintenancePlanResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("Maintenance plan created successfully")
                .data(created)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','DIRECTION','TECHNICIAN')")
    @Operation(summary = "Get all maintenance plans")
    public ResponseEntity<ApiResponse<PagedResponse<MaintenancePlanResponse>>> findAll(
            @RequestParam(required = false) MaintenancePlanType type,
            @RequestParam(required = false) MaintenancePlanFrequency frequency,
            @ParameterObject
            @PageableDefault(size = 20, sort = "nextExecutionDate", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        PagedResponse<MaintenancePlanResponse> maintenancePlans = maintenancePlanService.findAll(type, frequency, pageable);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<MaintenancePlanResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Maintenance plans fetched successfully")
                .data(maintenancePlans)
                .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','DIRECTION','TECHNICIAN')")
    @Operation(summary = "Get maintenance plan by id")
    public ResponseEntity<ApiResponse<MaintenancePlanResponse>> findById(@PathVariable @Positive Long id) {
        MaintenancePlanResponse maintenancePlan = maintenancePlanService.findById(id);
        return ResponseEntity.ok(ApiResponse.<MaintenancePlanResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Maintenance plan fetched successfully")
                .data(maintenancePlan)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(summary = "Update maintenance plan")
    public ResponseEntity<ApiResponse<MaintenancePlanResponse>> update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody MaintenancePlanRequest request
    ) {
        MaintenancePlanResponse updated = maintenancePlanService.update(id, request);
        return ResponseEntity.ok(ApiResponse.<MaintenancePlanResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Maintenance plan updated successfully")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(summary = "Delete maintenance plan")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable @Positive Long id) {
        maintenancePlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(HttpStatus.OK.value())
                .message("Maintenance plan deleted successfully")
                .data(null)
                .build());
    }
}
