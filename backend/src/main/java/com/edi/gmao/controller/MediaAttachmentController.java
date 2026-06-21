package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.attachment.AttachmentContentPayload;
import com.edi.gmao.dto.attachment.AttachmentResponse;
import com.edi.gmao.dto.attachment.AttachmentUpdateRequest;
import com.edi.gmao.dto.attachment.AttachmentUploadRequest;
import com.edi.gmao.entity.AttachmentEntityType;
import com.edi.gmao.service.MediaAttachmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attachments")
@Validated
@Tag(name = "Media Attachments", description = "Secure image attachments for maintenance entities")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN','OPERATOR','DIRECTION')")
public class MediaAttachmentController {

    private final MediaAttachmentService mediaAttachmentService;

    public MediaAttachmentController(MediaAttachmentService mediaAttachmentService) {
        this.mediaAttachmentService = mediaAttachmentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload image attachments")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> upload(
            @Valid @ModelAttribute AttachmentUploadRequest request,
            Authentication authentication
    ) {
        List<AttachmentResponse> attachments = mediaAttachmentService.upload(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<List<AttachmentResponse>>builder()
                .status(HttpStatus.CREATED.value())
                .message("Images uploaded successfully")
                .data(attachments)
                .build());
    }

    @GetMapping
    @Operation(summary = "List image attachments for an entity")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> list(
            @RequestParam AttachmentEntityType entityType,
            @RequestParam @Positive Long entityId,
            Authentication authentication
    ) {
        List<AttachmentResponse> attachments = mediaAttachmentService.list(entityType, entityId, authentication);
        return ResponseEntity.ok(ApiResponse.<List<AttachmentResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Attachments fetched successfully")
                .data(attachments)
                .build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get image attachment metadata")
    public ResponseEntity<ApiResponse<AttachmentResponse>> getMetadata(
            @PathVariable @Positive Long id,
            Authentication authentication
    ) {
        AttachmentResponse attachment = mediaAttachmentService.getMetadata(id, authentication);
        return ResponseEntity.ok(ApiResponse.<AttachmentResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Attachment fetched successfully")
                .data(attachment)
                .build());
    }

    @GetMapping("/{id}/content")
    @Operation(summary = "Get protected image content")
    public ResponseEntity<byte[]> getContent(
            @PathVariable @Positive Long id,
            Authentication authentication
    ) {
        AttachmentContentPayload payload = mediaAttachmentService.getContent(id, authentication);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(payload.mimeType()));
        headers.setContentLength(payload.fileSizeBytes());
        headers.setCacheControl(CacheControl.noStore());
        headers.setContentDisposition(ContentDisposition.inline()
                .filename(payload.originalFileName(), StandardCharsets.UTF_8)
                .build());
        return new ResponseEntity<>(payload.content(), headers, HttpStatus.OK);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update image attachment metadata")
    public ResponseEntity<ApiResponse<AttachmentResponse>> update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody AttachmentUpdateRequest request,
            Authentication authentication
    ) {
        AttachmentResponse attachment = mediaAttachmentService.update(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.<AttachmentResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Attachment updated successfully")
                .data(attachment)
                .build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an image attachment")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable @Positive Long id,
            Authentication authentication
    ) {
        mediaAttachmentService.delete(id, authentication);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(HttpStatus.OK.value())
                .message("Attachment deleted successfully")
                .data(null)
                .build());
    }
}
