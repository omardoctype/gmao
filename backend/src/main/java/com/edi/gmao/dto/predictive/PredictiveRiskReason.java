package com.edi.gmao.dto.predictive;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PredictiveRiskReason {

    private String criterion;
    private String detail;
    private int points;
}

