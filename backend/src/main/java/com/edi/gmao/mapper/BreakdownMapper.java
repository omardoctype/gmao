package com.edi.gmao.mapper;

import com.edi.gmao.dto.breakdown.BreakdownRequest;
import com.edi.gmao.dto.breakdown.BreakdownResponse;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.Equipment;
import org.springframework.stereotype.Component;

@Component
public class BreakdownMapper {

    public Breakdown toEntity(BreakdownRequest request, Equipment equipment) {
        Breakdown breakdown = new Breakdown();
        applyRequestToEntity(request, breakdown, equipment);
        return breakdown;
    }

    public void applyRequestToEntity(BreakdownRequest request, Breakdown breakdown, Equipment equipment) {
        breakdown.setReference(trim(request.getReference()));
        breakdown.setTitle(trim(request.getTitle()));
        breakdown.setDescription(trim(request.getDescription()));
        breakdown.setType(request.getType());
        breakdown.setPriority(request.getPriority());
        breakdown.setStatus(request.getStatus());
        breakdown.setEquipment(equipment);
    }

    public BreakdownResponse toResponse(Breakdown breakdown) {
        Equipment equipment = breakdown.getEquipment();
        return BreakdownResponse.builder()
                .id(breakdown.getId())
                .reference(breakdown.getReference())
                .title(breakdown.getTitle())
                .description(breakdown.getDescription())
                .type(breakdown.getType())
                .priority(breakdown.getPriority())
                .status(breakdown.getStatus())
                .declaredAt(breakdown.getDeclaredAt())
                .equipmentId(equipment.getId())
                .equipmentCode(equipment.getCode())
                .equipmentName(equipment.getName())
                .build();
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
