package com.edi.gmao.mapper;

import com.edi.gmao.dto.equipmentdocument.EquipmentDocumentResponse;
import com.edi.gmao.dto.interventionreport.InterventionReportResponse;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentDocument;
import com.edi.gmao.entity.InterventionReport;
import com.edi.gmao.entity.User;
import com.edi.gmao.entity.WorkOrder;
import org.springframework.stereotype.Component;

@Component
public class InterventionReportMapper {

    private final EquipmentDocumentMapper equipmentDocumentMapper;

    public InterventionReportMapper(EquipmentDocumentMapper equipmentDocumentMapper) {
        this.equipmentDocumentMapper = equipmentDocumentMapper;
    }

    public InterventionReportResponse toResponse(InterventionReport report) {
        WorkOrder workOrder = report.getWorkOrder();
        Equipment equipment = report.getEquipment();
        Breakdown breakdown = report.getBreakdown();
        User technician = report.getTechnician();
        EquipmentDocument document = report.getEquipmentDocument();
        EquipmentDocumentResponse documentResponse = document == null ? null : equipmentDocumentMapper.toResponse(document);

        return InterventionReportResponse.builder()
                .id(report.getId())
                .workOrderId(workOrder.getId())
                .workOrderReference(workOrder.getReference())
                .equipmentId(equipment.getId())
                .equipmentCode(equipment.getCode())
                .equipmentName(equipment.getName())
                .breakdownId(breakdown == null ? null : breakdown.getId())
                .breakdownReference(breakdown == null ? null : breakdown.getReference())
                .technicianId(technician.getId())
                .technicianName(technician.getFirstName() + " " + technician.getLastName())
                .performedTasks(report.getPerformedTasks())
                .realDiagnosis(report.getRealDiagnosis())
                .rootCause(report.getRootCause())
                .usedParts(report.getUsedParts())
                .interventionDurationMinutes(report.getInterventionDurationMinutes())
                .finalResult(report.getFinalResult())
                .futureRecommendations(report.getFutureRecommendations())
                .createdAt(report.getCreatedAt())
                .closedAt(report.getClosedAt())
                .equipmentDocument(documentResponse)
                .build();
    }
}
