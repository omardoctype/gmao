package com.edi.gmao.dto.dashboard;

import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DashboardPriorityBreakdownResponse {

    private Long id;
    private String reference;
    private String title;
    private BreakdownPriority priority;
    private BreakdownStatus status;
    private LocalDateTime declaredAt;
    private String equipmentCode;
    private String equipmentName;
}
