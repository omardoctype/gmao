package com.edi.gmao.mapper;

import com.edi.gmao.dto.workorder.WorkOrderRequest;
import com.edi.gmao.dto.workorder.WorkOrderResponse;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.User;
import com.edi.gmao.entity.WorkOrder;
import org.springframework.stereotype.Component;

@Component
public class WorkOrderMapper {

    public WorkOrder toEntity(WorkOrderRequest request, Equipment equipment, Breakdown breakdown) {
        WorkOrder workOrder = new WorkOrder();
        applyRequestToEntity(request, workOrder, equipment, breakdown);
        return workOrder;
    }

    public void applyRequestToEntity(
            WorkOrderRequest request,
            WorkOrder workOrder,
            Equipment equipment,
            Breakdown breakdown
    ) {
        workOrder.setReference(trim(request.getReference()));
        workOrder.setType(request.getType());
        workOrder.setStatus(request.getStatus());
        workOrder.setPriority(request.getPriority());
        workOrder.setPlannedDate(request.getPlannedDate());
        workOrder.setEstimatedCost(request.getEstimatedCost());
        workOrder.setRealCost(request.getRealCost());
        workOrder.setDescription(trim(request.getDescription()));
        workOrder.setEquipment(equipment);
        workOrder.setBreakdown(breakdown);
    }

    public WorkOrderResponse toResponse(WorkOrder workOrder) {
        Equipment equipment = workOrder.getEquipment();
        Breakdown breakdown = workOrder.getBreakdown();
        User technician = workOrder.getAssignedTechnician();

        return WorkOrderResponse.builder()
                .id(workOrder.getId())
                .reference(workOrder.getReference())
                .type(workOrder.getType())
                .status(workOrder.getStatus())
                .priority(workOrder.getPriority())
                .createdAt(workOrder.getCreatedAt())
                .plannedDate(workOrder.getPlannedDate())
                .startedAt(workOrder.getStartedAt())
                .completedAt(workOrder.getCompletedAt())
                .estimatedCost(workOrder.getEstimatedCost())
                .realCost(workOrder.getRealCost())
                .description(workOrder.getDescription())
                .equipmentId(equipment.getId())
                .equipmentCode(equipment.getCode())
                .equipmentName(equipment.getName())
                .breakdownId(breakdown == null ? null : breakdown.getId())
                .breakdownReference(breakdown == null ? null : breakdown.getReference())
                .assignedTechnicianId(technician == null ? null : technician.getId())
                .assignedTechnicianName(technician == null
                        ? null
                        : technician.getFirstName() + " " + technician.getLastName())
                .build();
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
