package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.dashboard.DashboardCriticalStockResponse;
import com.edi.gmao.dto.dashboard.DashboardPriorityBreakdownResponse;
import com.edi.gmao.dto.dashboard.DashboardRecentWorkOrderResponse;
import com.edi.gmao.dto.dashboard.DashboardSummaryResponse;
import com.edi.gmao.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Validated
@PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN','STOREKEEPER','OPERATOR','DIRECTION')")
@Tag(name = "Dashboard", description = "Dashboard indicators for industrial GMAO")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get dashboard summary indicators")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary() {
        DashboardSummaryResponse summary = dashboardService.getSummary();
        return ResponseEntity.ok(ApiResponse.<DashboardSummaryResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Dashboard summary fetched successfully")
                .data(summary)
                .build());
    }

    @GetMapping("/recent-work-orders")
    @Operation(summary = "Get recent work orders")
    public ResponseEntity<ApiResponse<List<DashboardRecentWorkOrderResponse>>> getRecentWorkOrders(
            @RequestParam(defaultValue = "5") @Positive @Max(50) int limit
    ) {
        List<DashboardRecentWorkOrderResponse> recentWorkOrders = dashboardService.getRecentWorkOrders(limit);
        return ResponseEntity.ok(ApiResponse.<List<DashboardRecentWorkOrderResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Recent work orders fetched successfully")
                .data(recentWorkOrders)
                .build());
    }

    @GetMapping("/priority-breakdowns")
    @Operation(summary = "Get priority breakdowns")
    public ResponseEntity<ApiResponse<List<DashboardPriorityBreakdownResponse>>> getPriorityBreakdowns(
            @RequestParam(defaultValue = "5") @Positive @Max(50) int limit
    ) {
        List<DashboardPriorityBreakdownResponse> priorityBreakdowns = dashboardService.getPriorityBreakdowns(limit);
        return ResponseEntity.ok(ApiResponse.<List<DashboardPriorityBreakdownResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Priority breakdowns fetched successfully")
                .data(priorityBreakdowns)
                .build());
    }

    @GetMapping("/critical-stock")
    @Operation(summary = "Get spare parts under critical stock threshold")
    public ResponseEntity<ApiResponse<List<DashboardCriticalStockResponse>>> getCriticalStock(
            @RequestParam(defaultValue = "5") @Positive @Max(50) int limit
    ) {
        List<DashboardCriticalStockResponse> criticalStock = dashboardService.getCriticalStock(limit);
        return ResponseEntity.ok(ApiResponse.<List<DashboardCriticalStockResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Critical stock fetched successfully")
                .data(criticalStock)
                .build());
    }
}
