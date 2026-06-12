package com.edi.gmao.mapper;

import com.edi.gmao.dto.maintenanceplan.MaintenancePlanRequest;
import com.edi.gmao.dto.maintenanceplan.MaintenancePlanResponse;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.MaintenancePlan;
import org.springframework.stereotype.Component;

@Component
public class MaintenancePlanMapper {

    public MaintenancePlan toEntity(MaintenancePlanRequest request, Equipment equipment) {
        MaintenancePlan maintenancePlan = new MaintenancePlan();
        applyRequestToEntity(request, maintenancePlan, equipment);
        return maintenancePlan;
    }

    public void applyRequestToEntity(
            MaintenancePlanRequest request,
            MaintenancePlan maintenancePlan,
            Equipment equipment
    ) {
        maintenancePlan.setType(request.getType());
        maintenancePlan.setFrequency(request.getFrequency());
        maintenancePlan.setNextExecutionDate(request.getNextExecutionDate());
        maintenancePlan.setDescription(trim(request.getDescription()));
        maintenancePlan.setEquipment(equipment);
    }

    public MaintenancePlanResponse toResponse(MaintenancePlan maintenancePlan) {
        Equipment equipment = maintenancePlan.getEquipment();
        return MaintenancePlanResponse.builder()
                .id(maintenancePlan.getId())
                .type(maintenancePlan.getType())
                .frequency(maintenancePlan.getFrequency())
                .nextExecutionDate(maintenancePlan.getNextExecutionDate())
                .description(maintenancePlan.getDescription())
                .equipmentId(equipment.getId())
                .equipmentCode(equipment.getCode())
                .equipmentName(equipment.getName())
                .build();
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
