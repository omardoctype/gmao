package com.edi.gmao.mapper;

import com.edi.gmao.dto.equipment.EquipmentRequest;
import com.edi.gmao.dto.equipment.EquipmentResponse;
import com.edi.gmao.entity.Equipment;
import org.springframework.stereotype.Component;

@Component
public class EquipmentMapper {

    public Equipment toEntity(EquipmentRequest request) {
        Equipment equipment = new Equipment();
        applyRequestToEntity(request, equipment);
        return equipment;
    }

    public void applyRequestToEntity(EquipmentRequest request, Equipment equipment) {
        equipment.setCode(trim(request.getCode()));
        equipment.setName(trim(request.getName()));
        equipment.setCategory(trim(request.getCategory()));
        equipment.setBrand(trim(request.getBrand()));
        equipment.setModel(trim(request.getModel()));
        equipment.setSerialNumber(trim(request.getSerialNumber()));
        equipment.setLocation(trim(request.getLocation()));
        equipment.setStatus(request.getStatus());
        equipment.setCriticality(request.getCriticality());
        equipment.setInstallationDate(request.getInstallationDate());
        equipment.setDescription(trim(request.getDescription()));
    }

    public EquipmentResponse toResponse(Equipment equipment) {
        return EquipmentResponse.builder()
                .id(equipment.getId())
                .code(equipment.getCode())
                .name(equipment.getName())
                .category(equipment.getCategory())
                .brand(equipment.getBrand())
                .model(equipment.getModel())
                .serialNumber(equipment.getSerialNumber())
                .location(equipment.getLocation())
                .status(equipment.getStatus())
                .criticality(equipment.getCriticality())
                .installationDate(equipment.getInstallationDate())
                .description(equipment.getDescription())
                .build();
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
