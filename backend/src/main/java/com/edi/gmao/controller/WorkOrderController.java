package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.interventionreport.InterventionReportRequest;
import com.edi.gmao.dto.interventionreport.InterventionReportResponse;
import com.edi.gmao.dto.workorder.WorkOrderRequest;
import com.edi.gmao.dto.workorder.WorkOrderResponse;
import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import com.edi.gmao.service.WorkOrderService;
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
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/work-orders")
@Validated
@Tag(name = "Work Orders", description = "Work order management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(
            summary = "Create a work order",
            description = "Cree un ordre de travail (OT). Acces: RESPONSABLE_MAINTENANCE."
    )
    public ResponseEntity<ApiResponse<WorkOrderResponse>> create(@Valid @RequestBody WorkOrderRequest request) {
        WorkOrderResponse created = workOrderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<WorkOrderResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("Work order created successfully")
                .data(created)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN')")
    @Operation(summary = "Get work orders")
    public ResponseEntity<ApiResponse<PagedResponse<WorkOrderResponse>>> findAll(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) WorkOrderStatus status,
            @RequestParam(required = false) WorkOrderPriority priority,
            @RequestParam(required = false) WorkOrderType type,
            @ParameterObject
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<WorkOrderResponse> workOrders = workOrderService.findAll(
                authentication,
                search,
                status,
                priority,
                type,
                pageable
        );
        return ResponseEntity.ok(ApiResponse.<PagedResponse<WorkOrderResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Work orders fetched successfully")
                .data(workOrders)
                .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN')")
    @Operation(summary = "Get work order by id")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> findById(
            @PathVariable @Positive Long id,
            Authentication authentication
    ) {
        WorkOrderResponse workOrder = workOrderService.findById(id, authentication);
        return ResponseEntity.ok(ApiResponse.<WorkOrderResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Work order fetched successfully")
                .data(workOrder)
                .build());
    }

    @GetMapping("/{id}/report")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN')")
    @Operation(summary = "Get intervention report by work order id")
    public ResponseEntity<ApiResponse<InterventionReportResponse>> findReportByWorkOrderId(
            @PathVariable @Positive Long id,
            Authentication authentication
    ) {
        InterventionReportResponse report = workOrderService.findReportByWorkOrderId(id, authentication);
        return ResponseEntity.ok(ApiResponse.<InterventionReportResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Intervention report fetched successfully")
                .data(report)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(summary = "Update work order")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody WorkOrderRequest request
    ) {
        WorkOrderResponse updated = workOrderService.update(id, request);
        return ResponseEntity.ok(ApiResponse.<WorkOrderResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Work order updated successfully")
                .data(updated)
                .build());
    }

    @PatchMapping("/{id}/assign/{technicianId}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(
            summary = "Assign technician to work order",
            description = "Affecte un technicien a un OT. Acces: RESPONSABLE_MAINTENANCE."
    )
    public ResponseEntity<ApiResponse<WorkOrderResponse>> assignTechnician(
            @PathVariable @Positive Long id,
            @PathVariable @Positive Long technicianId
    ) {
        WorkOrderResponse updated = workOrderService.assignTechnician(id, technicianId);
        return ResponseEntity.ok(ApiResponse.<WorkOrderResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Technician assigned successfully")
                .data(updated)
                .build());
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Accept assigned work order")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> accept(
            @PathVariable @Positive Long id,
            Authentication authentication
    ) {
        WorkOrderResponse updated = workOrderService.accept(id, authentication);
        return ResponseEntity.ok(ApiResponse.<WorkOrderResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Work order accepted successfully")
                .data(updated)
                .build());
    }

    @RequestMapping(value = "/{id}/start", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Start assigned work order")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> start(
            @PathVariable @Positive Long id,
            Authentication authentication
    ) {
        WorkOrderResponse updated = workOrderService.start(id, authentication);
        return ResponseEntity.ok(ApiResponse.<WorkOrderResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Work order started successfully")
                .data(updated)
                .build());
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(
            summary = "Close work order",
            description = "Cloture un OT en cours. Acces: RESPONSABLE_MAINTENANCE."
    )
    public ResponseEntity<ApiResponse<WorkOrderResponse>> close(@PathVariable @Positive Long id) {
        WorkOrderResponse updated = workOrderService.close(id);
        return ResponseEntity.ok(ApiResponse.<WorkOrderResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Work order closed successfully")
                .data(updated)
                .build());
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(
            summary = "Complete work order with intervention report",
            description = "Termine une intervention en cours, calcule la duree reelle et sauvegarde le rapport terrain."
    )
    public ResponseEntity<ApiResponse<InterventionReportResponse>> complete(
            @PathVariable @Positive Long id,
            @Valid @RequestBody InterventionReportRequest request,
            Authentication authentication
    ) {
        InterventionReportResponse report = workOrderService.closeWithReport(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.<InterventionReportResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Work order completed with intervention report successfully")
                .data(report)
                .build());
    }

    @PatchMapping("/{id}/close-with-report")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN')")
    @Operation(
            summary = "Close work order with intervention report",
            description = "Cloture un OT en cours, sauvegarde le rapport terrain et attache un document Markdown a l'equipement."
    )
    public ResponseEntity<ApiResponse<InterventionReportResponse>> closeWithReport(
            @PathVariable @Positive Long id,
            @Valid @RequestBody InterventionReportRequest request,
            Authentication authentication
    ) {
        InterventionReportResponse report = workOrderService.closeWithReport(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.<InterventionReportResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Work order closed with intervention report successfully")
                .data(report)
                .build());
    }
}
