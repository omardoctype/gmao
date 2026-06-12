package com.edi.gmao.dto.dashboard;

import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DashboardRecentWorkOrderResponse {

    private Long id;
    private String reference;
    private WorkOrderStatus status;
    private WorkOrderPriority priority;
    private LocalDateTime createdAt;
    private String equipmentCode;
    private String equipmentName;
    private String assignedTechnicianName;
}
