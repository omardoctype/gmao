package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.sparepart.SparePartRequest;
import com.edi.gmao.dto.sparepart.SparePartResponse;
import com.edi.gmao.dto.stock.StockMovementRequest;
import com.edi.gmao.dto.stock.StockMovementResponse;
import com.edi.gmao.service.SparePartService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/spare-parts")
@PreAuthorize("hasAnyRole('ADMIN','STOREKEEPER')")
@Validated
@Tag(name = "Spare Parts", description = "Spare parts and stock operations")
@SecurityRequirement(name = "bearerAuth")
public class SparePartController {

    private final SparePartService sparePartService;

    public SparePartController(SparePartService sparePartService) {
        this.sparePartService = sparePartService;
    }

    @PostMapping
    @Operation(summary = "Create a spare part")
    public ResponseEntity<ApiResponse<SparePartResponse>> create(@Valid @RequestBody SparePartRequest request) {
        SparePartResponse created = sparePartService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<SparePartResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("Spare part created successfully")
                .data(created)
                .build());
    }

    @GetMapping
    @Operation(summary = "Get all spare parts")
    public ResponseEntity<ApiResponse<PagedResponse<SparePartResponse>>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer minimumThreshold,
            @ParameterObject
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<SparePartResponse> spareParts = sparePartService.findAll(
                search,
                category,
                minimumThreshold,
                pageable
        );
        return ResponseEntity.ok(ApiResponse.<PagedResponse<SparePartResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Spare parts fetched successfully")
                .data(spareParts)
                .build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get spare part by id")
    public ResponseEntity<ApiResponse<SparePartResponse>> findById(@PathVariable @Positive Long id) {
        SparePartResponse sparePart = sparePartService.findById(id);
        return ResponseEntity.ok(ApiResponse.<SparePartResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Spare part fetched successfully")
                .data(sparePart)
                .build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update spare part")
    public ResponseEntity<ApiResponse<SparePartResponse>> update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody SparePartRequest request
    ) {
        SparePartResponse updated = sparePartService.update(id, request);
        return ResponseEntity.ok(ApiResponse.<SparePartResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Spare part updated successfully")
                .data(updated)
                .build());
    }

    @PostMapping("/{id}/stock-in")
    @Operation(
            summary = "Add quantity to stock",
            description = "Enregistre une entree de stock sur une piece. Acces: ADMIN, STOREKEEPER."
    )
    public ResponseEntity<ApiResponse<StockMovementResponse>> stockIn(
            @PathVariable @Positive Long id,
            @Valid @RequestBody StockMovementRequest request
    ) {
        StockMovementResponse movement = sparePartService.stockIn(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<StockMovementResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("Stock-in movement recorded successfully")
                .data(movement)
                .build());
    }

    @PostMapping("/{id}/stock-out")
    @Operation(
            summary = "Remove quantity from stock",
            description = "Enregistre une sortie de stock sur une piece. Acces: ADMIN, STOREKEEPER."
    )
    public ResponseEntity<ApiResponse<StockMovementResponse>> stockOut(
            @PathVariable @Positive Long id,
            @Valid @RequestBody StockMovementRequest request
    ) {
        StockMovementResponse movement = sparePartService.stockOut(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<StockMovementResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("Stock-out movement recorded successfully")
                .data(movement)
                .build());
    }
}
