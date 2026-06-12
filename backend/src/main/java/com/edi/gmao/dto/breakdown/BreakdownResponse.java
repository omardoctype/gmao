package com.edi.gmao.dto.breakdown;

import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import com.edi.gmao.entity.BreakdownType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Representation d'une panne")
public class BreakdownResponse {

    @Schema(example = "12")
    private Long id;
    @Schema(example = "BR-2026-001")
    private String reference;
    @Schema(example = "Arret convoyeur ligne 2")
    private String title;
    private String description;
    private BreakdownType type;
    private BreakdownPriority priority;
    private BreakdownStatus status;
    private LocalDateTime declaredAt;
    private Long equipmentId;
    private String equipmentCode;
    private String equipmentName;
}
