package com.edi.gmao.dto.predictive;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PredictiveDashboardResponse {

    private long lowCount;
    private long mediumCount;
    private long highCount;
    private long criticalCount;
    private double averageRiskScore;
    private List<PredictiveRiskResponse> topRiskEquipments;
}

