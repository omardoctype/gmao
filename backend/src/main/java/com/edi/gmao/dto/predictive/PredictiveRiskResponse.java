package com.edi.gmao.dto.predictive;

import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PredictiveRiskResponse {

    private Long equipmentId;
    private String equipmentCode;
    private String equipmentName;
    private String category;
    private String location;
    private EquipmentCriticality criticality;
    private EquipmentStatus status;
    private int riskScore;
    private PredictiveRiskLevel riskLevel;
    private List<PredictiveRiskReason> reasons;
    private String recommendedAction;
}

