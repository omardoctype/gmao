package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.equipment.EquipmentRequest;
import com.edi.gmao.dto.equipment.EquipmentResponse;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.service.EquipmentService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/equipments")
@Validated
@Tag(name = "Equipments", description = "Equipment management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(
            summary = "Create a new equipment",
            description = "Cree un equipement industriel. Acces: ADMIN, RESPONSABLE_MAINTENANCE."
    )
    public ResponseEntity<ApiResponse<EquipmentResponse>> create(@Valid @RequestBody EquipmentRequest request) {
        EquipmentResponse createdEquipment = equipmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<EquipmentResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("Equipment created successfully")
                .data(createdEquipment)
                .build());
    }

    @GetMapping
    @Operation(
            summary = "Get all equipments",
            description = "Retourne la liste paginee des equipements avec filtres optionnels (name/category/status/criticality)."
    )
    public ResponseEntity<ApiResponse<PagedResponse<EquipmentResponse>>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) EquipmentStatus status,
            @RequestParam(required = false) EquipmentCriticality criticality,
            @ParameterObject
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<EquipmentResponse> equipments = equipmentService.findAll(
                search,
                name,
                category,
                status,
                criticality,
                pageable
        );
        return ResponseEntity.ok(ApiResponse.<PagedResponse<EquipmentResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Equipments fetched successfully")
                .data(equipments)
                .build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get equipment by id")
    public ResponseEntity<ApiResponse<EquipmentResponse>> findById(@PathVariable @Positive Long id) {
        EquipmentResponse equipment = equipmentService.findById(id);
        return ResponseEntity.ok(ApiResponse.<EquipmentResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Equipment fetched successfully")
                .data(equipment)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(summary = "Update equipment by id")
    public ResponseEntity<ApiResponse<EquipmentResponse>> update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody EquipmentRequest request
    ) {
        EquipmentResponse updatedEquipment = equipmentService.update(id, request);
        return ResponseEntity.ok(ApiResponse.<EquipmentResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Equipment updated successfully")
                .data(updatedEquipment)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(summary = "Delete equipment by id")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable @Positive Long id) {
        equipmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(HttpStatus.OK.value())
                .message("Equipment deleted successfully")
                .data(null)
                .build());
    }
}
