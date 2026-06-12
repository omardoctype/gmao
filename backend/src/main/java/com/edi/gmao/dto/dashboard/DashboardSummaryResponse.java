package com.edi.gmao.dto.dashboard;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DashboardSummaryResponse {

    private long totalEquipments;
    private long openBreakdowns;
    private long inProgressWorkOrders;
    private long criticalSpareParts;
}
