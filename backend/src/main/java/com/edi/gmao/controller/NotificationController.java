package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.notification.NotificationResponse;
import com.edi.gmao.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@Validated
@PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN','STOREKEEPER','OPERATOR','DIRECTION')")
@Tag(name = "Notifications", description = "Business notifications endpoints")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get all notifications")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> findAll() {
        List<NotificationResponse> notifications = notificationService.findAll();
        return ResponseEntity.ok(ApiResponse.<List<NotificationResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Notifications fetched successfully")
                .data(notifications)
                .build());
    }

    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> findUnread() {
        List<NotificationResponse> notifications = notificationService.findUnread();
        return ResponseEntity.ok(ApiResponse.<List<NotificationResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Unread notifications fetched successfully")
                .data(notifications)
                .build());
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(@PathVariable @Positive Long id) {
        NotificationResponse response = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.<NotificationResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Notification marked as read")
                .data(response)
                .build());
    }
}
