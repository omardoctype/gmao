package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.equipmentdocument.EquipmentDocumentDownloadPayload;
import com.edi.gmao.dto.equipmentdocument.EquipmentDocumentResponse;
import com.edi.gmao.dto.equipmentdocument.EquipmentDocumentUploadRequest;
import com.edi.gmao.service.EquipmentDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/equipments/{equipmentId}/documents")
@Validated
@Tag(name = "Equipment Documents", description = "Document management for equipments")
@SecurityRequirement(name = "bearerAuth")
public class EquipmentDocumentController {

    private final EquipmentDocumentService equipmentDocumentService;

    public EquipmentDocumentController(EquipmentDocumentService equipmentDocumentService) {
        this.equipmentDocumentService = equipmentDocumentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN')")
    @Operation(summary = "Upload a document for an equipment")
    public ResponseEntity<ApiResponse<EquipmentDocumentResponse>> upload(
            @PathVariable @Positive Long equipmentId,
            @Valid @ModelAttribute EquipmentDocumentUploadRequest request
    ) {
        EquipmentDocumentResponse uploadedDocument = equipmentDocumentService.upload(equipmentId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<EquipmentDocumentResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("Equipment document uploaded successfully")
                .data(uploadedDocument)
                .build());
    }

    @PostMapping("/generate-ai")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(summary = "Generate and attach an AI technical document for an equipment")
    public ResponseEntity<ApiResponse<EquipmentDocumentResponse>> generateAiDocument(
            @PathVariable @Positive Long equipmentId
    ) {
        EquipmentDocumentResponse generatedDocument = equipmentDocumentService.generateAiDocument(equipmentId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<EquipmentDocumentResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("AI equipment document generated successfully")
                .data(generatedDocument)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN')")
    @Operation(summary = "List all documents for an equipment")
    public ResponseEntity<ApiResponse<List<EquipmentDocumentResponse>>> list(
            @PathVariable @Positive Long equipmentId
    ) {
        List<EquipmentDocumentResponse> documents = equipmentDocumentService.list(equipmentId);
        return ResponseEntity.ok(ApiResponse.<List<EquipmentDocumentResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Equipment documents fetched successfully")
                .data(documents)
                .build());
    }

    @GetMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN')")
    @Operation(summary = "Get equipment document metadata")
    public ResponseEntity<ApiResponse<EquipmentDocumentResponse>> getMetadata(
            @PathVariable @Positive Long equipmentId,
            @PathVariable @Positive Long documentId
    ) {
        EquipmentDocumentResponse metadata = equipmentDocumentService.getMetadata(equipmentId, documentId);
        return ResponseEntity.ok(ApiResponse.<EquipmentDocumentResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Equipment document metadata fetched successfully")
                .data(metadata)
                .build());
    }

    @GetMapping("/{documentId}/download")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN')")
    @Operation(summary = "Download a document linked to an equipment")
    public ResponseEntity<byte[]> download(
            @PathVariable @Positive Long equipmentId,
            @PathVariable @Positive Long documentId
    ) {
        EquipmentDocumentDownloadPayload payload = equipmentDocumentService.download(equipmentId, documentId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(payload.contentType()));
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename(encodeFileName(payload.originalFileName()), StandardCharsets.UTF_8)
                        .build()
        );
        headers.setContentLength(payload.size());

        return new ResponseEntity<>(payload.content(), headers, HttpStatus.OK);
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE')")
    @Operation(summary = "Delete a document linked to an equipment")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable @Positive Long equipmentId,
            @PathVariable @Positive Long documentId
    ) {
        equipmentDocumentService.delete(equipmentId, documentId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(HttpStatus.OK.value())
                .message("Equipment document deleted successfully")
                .data(null)
                .build());
    }

    private String encodeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "document";
        }
        return fileName;
    }
}
