package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.audit.AuditLogResponse;
import com.edi.gmao.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-logs")
@Validated
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Logs", description = "Audit trail consultation endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Get audit logs with simple filters")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogResponse>>> findAll(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String username,
            @ParameterObject
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<AuditLogResponse> logs = auditLogService.findAll(action, entityType, username, pageable);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<AuditLogResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Audit logs fetched successfully")
                .data(logs)
                .build());
    }
}
