package com.edi.gmao.controller;

import com.edi.gmao.dto.ApiResponse;
import com.edi.gmao.dto.ai.AiAskRequest;
import com.edi.gmao.dto.ai.AiAskResponse;
import com.edi.gmao.dto.ai.AiDiagnosisRequest;
import com.edi.gmao.dto.ai.AiDiagnosisResponse;
import com.edi.gmao.dto.ai.AiHealthResponse;
import com.edi.gmao.service.AiAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@Validated
@Tag(name = "AI Assistant", description = "IA assistant proxy endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AiController {

    private static final Logger log = LoggerFactory.getLogger(AiController.class);

    private final AiAssistantService aiAssistantService;

    public AiController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @GetMapping("/health")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN','DIRECTION','OPERATOR')")
    @Operation(summary = "Get AI service health")
    public ResponseEntity<ApiResponse<AiHealthResponse>> health() {
        long startedAt = System.nanoTime();
        try {
            AiHealthResponse response = aiAssistantService.health();
            return ResponseEntity.ok(ApiResponse.<AiHealthResponse>builder()
                    .status(HttpStatus.OK.value())
                    .message("AI service health fetched successfully")
                    .data(response)
                    .build());
        } finally {
            logEndpointTiming("/api/ai/health", startedAt);
        }
    }

    @PostMapping("/ask")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN','DIRECTION')")
    @Operation(summary = "Ask a question to the AI service")
    public ResponseEntity<ApiResponse<AiAskResponse>> ask(@Valid @RequestBody AiAskRequest request) {
        long startedAt = System.nanoTime();
        try {
            AiAskResponse response = aiAssistantService.ask(request);
            return ResponseEntity.ok(ApiResponse.<AiAskResponse>builder()
                    .status(HttpStatus.OK.value())
                    .message("AI ask request processed successfully")
                    .data(response)
                    .build());
        } finally {
            logEndpointTiming("/api/ai/ask", startedAt);
        }
    }

    @PostMapping("/diagnosis")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE_MAINTENANCE','TECHNICIAN','OPERATOR')")
    @Operation(summary = "Request diagnosis from the AI service")
    public ResponseEntity<ApiResponse<AiDiagnosisResponse>> diagnosis(
            @Valid @RequestBody AiDiagnosisRequest request
    ) {
        long startedAt = System.nanoTime();
        try {
            AiDiagnosisResponse response = aiAssistantService.diagnosis(request);
            return ResponseEntity.ok(ApiResponse.<AiDiagnosisResponse>builder()
                    .status(HttpStatus.OK.value())
                    .message("AI diagnosis request processed successfully")
                    .data(response)
                    .build());
        } finally {
            logEndpointTiming("/api/ai/diagnosis", startedAt);
        }
    }

    private void logEndpointTiming(String path, long startedAtNanos) {
        long totalMs = TimeUnit.NANOSECONDS.toMillis(Math.max(0, System.nanoTime() - startedAtNanos));
        log.info("AI endpoint timing path={} totalMs={}", path, totalMs);
    }
}
