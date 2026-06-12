package com.edi.gmao.dto.maintenanceplan;

import com.edi.gmao.entity.MaintenancePlanFrequency;
import com.edi.gmao.entity.MaintenancePlanType;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MaintenancePlanResponse {

    private Long id;
    private MaintenancePlanType type;
    private MaintenancePlanFrequency frequency;
    private LocalDate nextExecutionDate;
    private String description;
    private Long equipmentId;
    private String equipmentCode;
    private String equipmentName;
}
