package com.edi.gmao.service;

import com.edi.gmao.dto.dashboard.DashboardCriticalStockResponse;
import com.edi.gmao.dto.dashboard.DashboardPriorityBreakdownResponse;
import com.edi.gmao.dto.dashboard.DashboardRecentWorkOrderResponse;
import com.edi.gmao.dto.dashboard.DashboardSummaryResponse;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import com.edi.gmao.entity.SparePart;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.repository.BreakdownRepository;
import com.edi.gmao.repository.EquipmentRepository;
import com.edi.gmao.repository.SparePartRepository;
import com.edi.gmao.repository.WorkOrderRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final EquipmentRepository equipmentRepository;
    private final BreakdownRepository breakdownRepository;
    private final WorkOrderRepository workOrderRepository;
    private final SparePartRepository sparePartRepository;

    public DashboardService(
            EquipmentRepository equipmentRepository,
            BreakdownRepository breakdownRepository,
            WorkOrderRepository workOrderRepository,
            SparePartRepository sparePartRepository
    ) {
        this.equipmentRepository = equipmentRepository;
        this.breakdownRepository = breakdownRepository;
        this.workOrderRepository = workOrderRepository;
        this.sparePartRepository = sparePartRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        return DashboardSummaryResponse.builder()
                .totalEquipments(equipmentRepository.count())
                .openBreakdowns(breakdownRepository.countByStatusNot(BreakdownStatus.RESOLVED))
                .inProgressWorkOrders(workOrderRepository.countByStatus(WorkOrderStatus.IN_PROGRESS))
                .criticalSpareParts(sparePartRepository.countCriticalStock())
                .build();
    }

    @Transactional(readOnly = true)
    public List<DashboardRecentWorkOrderResponse> getRecentWorkOrders(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return workOrderRepository.findAllByOrderByCreatedAtDesc(pageable).stream()
                .map(this::toRecentWorkOrderResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DashboardPriorityBreakdownResponse> getPriorityBreakdowns(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return breakdownRepository.findPriorityBreakdowns(
                        BreakdownStatus.RESOLVED,
                        List.of(BreakdownPriority.CRITICAL, BreakdownPriority.HIGH),
                        pageable
                ).stream()
                .map(this::toPriorityBreakdownResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DashboardCriticalStockResponse> getCriticalStock(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return sparePartRepository.findCriticalStock(pageable).stream()
                .map(this::toCriticalStockResponse)
                .toList();
    }

    private DashboardRecentWorkOrderResponse toRecentWorkOrderResponse(WorkOrder workOrder) {
        String technicianName = workOrder.getAssignedTechnician() == null
                ? null
                : workOrder.getAssignedTechnician().getFirstName() + " " + workOrder.getAssignedTechnician().getLastName();

        return DashboardRecentWorkOrderResponse.builder()
                .id(workOrder.getId())
                .reference(workOrder.getReference())
                .status(workOrder.getStatus())
                .priority(workOrder.getPriority())
                .createdAt(workOrder.getCreatedAt())
                .equipmentCode(workOrder.getEquipment().getCode())
                .equipmentName(workOrder.getEquipment().getName())
                .assignedTechnicianName(technicianName)
                .build();
    }

    private DashboardPriorityBreakdownResponse toPriorityBreakdownResponse(Breakdown breakdown) {
        return DashboardPriorityBreakdownResponse.builder()
                .id(breakdown.getId())
                .reference(breakdown.getReference())
                .title(breakdown.getTitle())
                .priority(breakdown.getPriority())
                .status(breakdown.getStatus())
                .declaredAt(breakdown.getDeclaredAt())
                .equipmentCode(breakdown.getEquipment().getCode())
                .equipmentName(breakdown.getEquipment().getName())
                .build();
    }

    private DashboardCriticalStockResponse toCriticalStockResponse(SparePart sparePart) {
        return DashboardCriticalStockResponse.builder()
                .id(sparePart.getId())
                .reference(sparePart.getReference())
                .name(sparePart.getName())
                .category(sparePart.getCategory())
                .quantityInStock(sparePart.getQuantityInStock())
                .minimumThreshold(sparePart.getMinimumThreshold())
                .unitPrice(sparePart.getUnitPrice())
                .build();
    }
}
