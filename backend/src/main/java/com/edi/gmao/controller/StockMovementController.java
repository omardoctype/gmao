package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.stock.StockMovementResponse;
import com.edi.gmao.service.StockMovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stock-movements")
@PreAuthorize("hasAnyRole('ADMIN','STOREKEEPER')")
@Validated
@Tag(name = "Stock Movements", description = "Stock movement history")
@SecurityRequirement(name = "bearerAuth")
public class StockMovementController {

    private final StockMovementService stockMovementService;

    public StockMovementController(StockMovementService stockMovementService) {
        this.stockMovementService = stockMovementService;
    }

    @GetMapping
    @Operation(summary = "Get stock movement history")
    public ResponseEntity<ApiResponse<List<StockMovementResponse>>> findAll() {
        List<StockMovementResponse> movements = stockMovementService.findAll();
        return ResponseEntity.ok(ApiResponse.<List<StockMovementResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Stock movements fetched successfully")
                .data(movements)
                .build());
    }
}
