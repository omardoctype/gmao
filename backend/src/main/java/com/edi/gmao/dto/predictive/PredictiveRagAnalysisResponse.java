package com.edi.gmao.dto.predictive;

import com.edi.gmao.dto.ai.AiSourceResponse;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PredictiveRagAnalysisResponse {

    private Long equipmentId;
    private String equipmentCode;
    private String equipmentName;
    private int riskScore;
    private PredictiveRiskLevel riskLevel;
    private List<String> riskReasons;
    private String predictiveRecommendedAction;
    private String ragAnalysis;
    private List<AiSourceResponse> sources;
}
