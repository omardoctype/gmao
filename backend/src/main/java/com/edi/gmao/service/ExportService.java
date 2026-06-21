package com.edi.gmao.service;

import com.edi.gmao.dto.export.ExportPayload;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.repository.BreakdownRepository;
import com.edi.gmao.repository.EquipmentRepository;
import com.edi.gmao.repository.WorkOrderRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ExportService {

    private static final String CSV_CONTENT_TYPE = "text/csv; charset=UTF-8";
    private static final DateTimeFormatter FILE_NAME_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final EquipmentRepository equipmentRepository;
    private final BreakdownRepository breakdownRepository;
    private final WorkOrderRepository workOrderRepository;

    public ExportService(
            EquipmentRepository equipmentRepository,
            BreakdownRepository breakdownRepository,
            WorkOrderRepository workOrderRepository
    ) {
        this.equipmentRepository = equipmentRepository;
        this.breakdownRepository = breakdownRepository;
        this.workOrderRepository = workOrderRepository;
    }

    public ExportPayload exportEquipmentsCsv() {
        List<Equipment> equipments = equipmentRepository.findAll().stream()
                .sorted(Comparator.comparing(Equipment::getId))
                .toList();

        StringBuilder csv = new StringBuilder();
        appendRow(csv,
                "id",
                "code",
                "name",
                "category",
                "brand",
                "model",
                "serialNumber",
                "location",
                "status",
                "criticality",
                "installationDate",
                "description"
        );

        for (Equipment equipment : equipments) {
            appendRow(csv,
                    equipment.getId(),
                    equipment.getCode(),
                    equipment.getName(),
                    equipment.getCategory(),
                    equipment.getBrand(),
                    equipment.getModel(),
                    equipment.getSerialNumber(),
                    equipment.getLocation(),
                    equipment.getStatus(),
                    equipment.getCriticality(),
                    formatDate(equipment.getInstallationDate()),
                    equipment.getDescription()
            );
        }

        return new ExportPayload(
                "equipments_export_" + timestampSuffix() + ".csv",
                CSV_CONTENT_TYPE,
                csv.toString().getBytes(StandardCharsets.UTF_8)
        );
    }

    public ExportPayload exportBreakdownsCsv() {
        List<Breakdown> breakdowns = breakdownRepository.findAll().stream()
                .sorted(Comparator.comparing(Breakdown::getId))
                .toList();

        StringBuilder csv = new StringBuilder();
        appendRow(csv,
                "id",
                "reference",
                "title",
                "description",
                "type",
                "priority",
                "status",
                "declaredAt",
                "equipmentId",
                "equipmentCode",
                "equipmentName"
        );

        for (Breakdown breakdown : breakdowns) {
            appendRow(csv,
                    breakdown.getId(),
                    breakdown.getReference(),
                    breakdown.getTitle(),
                    breakdown.getDescription(),
                    breakdown.getType(),
                    breakdown.getPriority(),
                    breakdown.getStatus(),
                    formatDateTime(breakdown.getDeclaredAt()),
                    breakdown.getEquipment() == null ? null : breakdown.getEquipment().getId(),
                    breakdown.getEquipment() == null ? null : breakdown.getEquipment().getCode(),
                    breakdown.getEquipment() == null ? null : breakdown.getEquipment().getName()
            );
        }

        return new ExportPayload(
                "breakdowns_export_" + timestampSuffix() + ".csv",
                CSV_CONTENT_TYPE,
                csv.toString().getBytes(StandardCharsets.UTF_8)
        );
    }

    public ExportPayload exportWorkOrdersCsv() {
        List<WorkOrder> workOrders = workOrderRepository.findAll().stream()
                .sorted(Comparator.comparing(WorkOrder::getId))
                .toList();

        StringBuilder csv = new StringBuilder();
        appendRow(csv,
                "id",
                "reference",
                "type",
                "status",
                "priority",
                "createdAt",
                "plannedDate",
                "assignedAt",
                "acceptedAt",
                "startedAt",
                "completedAt",
                "estimatedDurationMinutes",
                "actualDurationMinutes",
                "estimatedCost",
                "realCost",
                "description",
                "equipmentId",
                "equipmentCode",
                "equipmentName",
                "breakdownId",
                "breakdownReference",
                "assignedTechnicianId",
                "assignedTechnicianEmail"
        );

        for (WorkOrder workOrder : workOrders) {
            appendRow(csv,
                    workOrder.getId(),
                    workOrder.getReference(),
                    workOrder.getType(),
                    workOrder.getStatus(),
                    workOrder.getPriority(),
                    formatDateTime(workOrder.getCreatedAt()),
                    formatDateTime(workOrder.getPlannedDate()),
                    formatDateTime(workOrder.getAssignedAt()),
                    formatDateTime(workOrder.getAcceptedAt()),
                    formatDateTime(workOrder.getStartedAt()),
                    formatDateTime(workOrder.getCompletedAt()),
                    workOrder.getEstimatedDurationMinutes(),
                    workOrder.getActualDurationMinutes(),
                    formatDecimal(workOrder.getEstimatedCost()),
                    formatDecimal(workOrder.getRealCost()),
                    workOrder.getDescription(),
                    workOrder.getEquipment() == null ? null : workOrder.getEquipment().getId(),
                    workOrder.getEquipment() == null ? null : workOrder.getEquipment().getCode(),
                    workOrder.getEquipment() == null ? null : workOrder.getEquipment().getName(),
                    workOrder.getBreakdown() == null ? null : workOrder.getBreakdown().getId(),
                    workOrder.getBreakdown() == null ? null : workOrder.getBreakdown().getReference(),
                    workOrder.getAssignedTechnician() == null ? null : workOrder.getAssignedTechnician().getId(),
                    workOrder.getAssignedTechnician() == null ? null : workOrder.getAssignedTechnician().getEmail()
            );
        }

        return new ExportPayload(
                "work_orders_export_" + timestampSuffix() + ".csv",
                CSV_CONTENT_TYPE,
                csv.toString().getBytes(StandardCharsets.UTF_8)
        );
    }

    private void appendRow(StringBuilder csv, Object... values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                csv.append(',');
            }
            csv.append(escapeCsv(values[i]));
        }
        csv.append('\n');
    }

    private String escapeCsv(Object value) {
        if (value == null) {
            return "";
        }
        String raw = String.valueOf(value);
        String escaped = raw.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n") || escaped.contains("\r")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    private String formatDate(LocalDate value) {
        return value == null ? null : value.format(DATE_FORMAT);
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? null : value.format(DATE_TIME_FORMAT);
    }

    private String formatDecimal(BigDecimal value) {
        return value == null ? null : value.toPlainString();
    }

    private String timestampSuffix() {
        return LocalDateTime.now().format(FILE_NAME_DATE_FORMAT);
    }
}
