package com.edi.gmao.controller;

import com.edi.gmao.dto.export.ExportPayload;
import com.edi.gmao.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exports")
@Validated
@PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','DIRECTION')")
@Tag(name = "Exports", description = "CSV export endpoints for key GMAO data")
@SecurityRequirement(name = "bearerAuth")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @GetMapping("/equipments/csv")
    @Operation(summary = "Export equipments in CSV format")
    public ResponseEntity<byte[]> exportEquipmentsCsv() {
        return buildCsvResponse(exportService.exportEquipmentsCsv());
    }

    @GetMapping("/breakdowns/csv")
    @Operation(summary = "Export breakdowns in CSV format")
    public ResponseEntity<byte[]> exportBreakdownsCsv() {
        return buildCsvResponse(exportService.exportBreakdownsCsv());
    }

    @GetMapping("/work-orders/csv")
    @Operation(summary = "Export work orders in CSV format")
    public ResponseEntity<byte[]> exportWorkOrdersCsv() {
        return buildCsvResponse(exportService.exportWorkOrdersCsv());
    }

    private ResponseEntity<byte[]> buildCsvResponse(ExportPayload payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(payload.contentType()));
        headers.setContentDisposition(ContentDisposition.attachment().filename(payload.fileName()).build());
        headers.setContentLength(payload.content().length);

        return new ResponseEntity<>(payload.content(), headers, HttpStatus.OK);
    }
}
