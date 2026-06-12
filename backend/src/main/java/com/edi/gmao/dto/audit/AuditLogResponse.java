package com.edi.gmao.dto.audit;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuditLogResponse {

    private Long id;
    private String action;
    private String entityType;
    private Long entityId;
    private Long userId;
    private String username;
    private String details;
    private LocalDateTime createdAt;
}
