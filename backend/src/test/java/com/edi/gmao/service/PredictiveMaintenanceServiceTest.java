package com.edi.gmao.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.edi.gmao.dto.predictive.PredictiveDashboardResponse;
import com.edi.gmao.dto.predictive.PredictiveRiskLevel;
import com.edi.gmao.dto.predictive.PredictiveRiskResponse;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import com.edi.gmao.entity.BreakdownType;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.entity.InterventionReport;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import com.edi.gmao.repository.BreakdownRepository;
import com.edi.gmao.repository.EquipmentRepository;
import com.edi.gmao.repository.InterventionReportRepository;
import com.edi.gmao.repository.WorkOrderRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PredictiveMaintenanceServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;
    @Mock
    private BreakdownRepository breakdownRepository;
    @Mock
    private WorkOrderRepository workOrderRepository;
    @Mock
    private InterventionReportRepository interventionReportRepository;

    private PredictiveMaintenanceService predictiveMaintenanceService;

    @BeforeEach
    void setUp() {
        predictiveMaintenanceService = new PredictiveMaintenanceService(
                equipmentRepository,
                breakdownRepository,
                workOrderRepository,
                interventionReportRepository
        );
    }

    @Test
    void getEquipmentRisk_shouldComputeCriticalRiskAndCapScore() {
        LocalDateTime now = LocalDateTime.now();

        Equipment equipment = createEquipment(1L, "EQ-001", EquipmentCriticality.CRITICAL, EquipmentStatus.OUT_OF_SERVICE);

        List<Breakdown> breakdowns = List.of(
                createBreakdown(equipment, BreakdownPriority.CRITICAL, now.minusDays(2)),
                createBreakdown(equipment, BreakdownPriority.HIGH, now.minusDays(5)),
                createBreakdown(equipment, BreakdownPriority.CRITICAL, now.minusDays(10)),
                createBreakdown(equipment, BreakdownPriority.HIGH, now.minusDays(20))
        );

        List<WorkOrder> workOrders = new ArrayList<>();
        workOrders.add(createOpenWorkOrder(equipment, now.minusDays(8), now.minusDays(3), WorkOrderType.CORRECTIVE));
        workOrders.add(createOpenWorkOrder(equipment, now.minusDays(7), now.minusDays(2), WorkOrderType.CORRECTIVE));
        workOrders.add(createOpenWorkOrder(equipment, now.minusDays(6), now.minusDays(1), WorkOrderType.CORRECTIVE));
        workOrders.add(createOpenWorkOrder(equipment, now.minusDays(4), now.minusDays(1), WorkOrderType.CORRECTIVE));
        workOrders.add(createOpenWorkOrder(equipment, now.minusDays(3), now.minusDays(1), WorkOrderType.PREVENTIVE));

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(equipment));
        when(breakdownRepository.findAll()).thenReturn(breakdowns);
        when(workOrderRepository.findAll()).thenReturn(workOrders);

        PredictiveRiskResponse response = predictiveMaintenanceService.getEquipmentRisk(1L);

        assertEquals("EQ-001", response.getEquipmentCode());
        assertEquals(PredictiveRiskLevel.CRITICAL, response.getRiskLevel());
        assertEquals(100, response.getRiskScore());
        assertEquals("Intervention urgente recommandee.", response.getRecommendedAction());
        assertFalse(response.getReasons().isEmpty());
    }

    @Test
    void getDashboard_shouldAggregateByRiskLevel() {
        LocalDateTime now = LocalDateTime.now();

        Equipment lowRiskEquipment = createEquipment(1L, "EQ-LOW", EquipmentCriticality.LOW, EquipmentStatus.OPERATIONAL);
        Equipment mediumRiskEquipment = createEquipment(2L, "EQ-MED", EquipmentCriticality.HIGH, EquipmentStatus.MAINTENANCE);
        Equipment criticalRiskEquipment = createEquipment(3L, "EQ-CRIT", EquipmentCriticality.CRITICAL, EquipmentStatus.OUT_OF_SERVICE);

        List<Equipment> equipments = List.of(lowRiskEquipment, mediumRiskEquipment, criticalRiskEquipment);

        List<Breakdown> breakdowns = List.of(
                createBreakdown(mediumRiskEquipment, BreakdownPriority.LOW, now.minusDays(12)),
                createBreakdown(criticalRiskEquipment, BreakdownPriority.CRITICAL, now.minusDays(4)),
                createBreakdown(criticalRiskEquipment, BreakdownPriority.HIGH, now.minusDays(7)),
                createBreakdown(criticalRiskEquipment, BreakdownPriority.CRITICAL, now.minusDays(15)),
                createBreakdown(criticalRiskEquipment, BreakdownPriority.HIGH, now.minusDays(25))
        );

        List<WorkOrder> workOrders = new ArrayList<>();
        workOrders.add(createCompletedWorkOrder(lowRiskEquipment, now.minusDays(12), now.minusDays(10), WorkOrderType.PREVENTIVE));
        workOrders.add(createCompletedWorkOrder(mediumRiskEquipment, now.minusDays(22), now.minusDays(20), WorkOrderType.PREVENTIVE));
        workOrders.add(createOpenWorkOrder(criticalRiskEquipment, now.minusDays(8), now.minusDays(3), WorkOrderType.CORRECTIVE));
        workOrders.add(createOpenWorkOrder(criticalRiskEquipment, now.minusDays(6), now.minusDays(2), WorkOrderType.CORRECTIVE));
        workOrders.add(createOpenWorkOrder(criticalRiskEquipment, now.minusDays(5), now.minusDays(1), WorkOrderType.PREVENTIVE));
        workOrders.add(createOpenWorkOrder(criticalRiskEquipment, now.minusDays(4), now.minusDays(1), WorkOrderType.PREVENTIVE));
        workOrders.add(createOpenWorkOrder(criticalRiskEquipment, now.minusDays(3), now.minusDays(1), WorkOrderType.CORRECTIVE));

        when(equipmentRepository.findAll()).thenReturn(equipments);
        when(breakdownRepository.findAll()).thenReturn(breakdowns);
        when(workOrderRepository.findAll()).thenReturn(workOrders);

        PredictiveDashboardResponse dashboard = predictiveMaintenanceService.getDashboard();

        assertEquals(1, dashboard.getLowCount());
        assertEquals(1, dashboard.getMediumCount());
        assertEquals(0, dashboard.getHighCount());
        assertEquals(1, dashboard.getCriticalCount());
        assertEquals(3, dashboard.getTopRiskEquipments().size());
        assertEquals("EQ-CRIT", dashboard.getTopRiskEquipments().get(0).getEquipmentCode());
        assertTrue(dashboard.getAverageRiskScore() >= 0);
    }

    @Test
    void getEquipmentRisk_shouldAddModerateRiskReasonsFromRecentInterventionReport() {
        LocalDateTime now = LocalDateTime.now();
        Equipment equipment = createEquipment(4L, "EQ-RPT", EquipmentCriticality.LOW, EquipmentStatus.OPERATIONAL);

        WorkOrder preventiveWorkOrder = createCompletedWorkOrder(
                equipment,
                now.minusDays(8),
                now.minusDays(7),
                WorkOrderType.PREVENTIVE
        );
        InterventionReport report = createInterventionReport(
                equipment,
                preventiveWorkOrder,
                now.minusDays(1),
                "Alignement incorrect constate",
                "Resultat final a surveiller car bruit recurrent encore perceptible.",
                "Mettre en place une surveillance hebdomadaire pendant un mois."
        );

        when(equipmentRepository.findById(4L)).thenReturn(Optional.of(equipment));
        when(breakdownRepository.findAll()).thenReturn(List.of());
        when(workOrderRepository.findAll()).thenReturn(List.of(preventiveWorkOrder));
        when(interventionReportRepository.findTop5ByEquipmentIdOrderByClosedAtDesc(4L))
                .thenReturn(List.of(report));

        PredictiveRiskResponse response = predictiveMaintenanceService.getEquipmentRisk(4L);

        assertEquals(10, response.getRiskScore());
        assertEquals(PredictiveRiskLevel.LOW, response.getRiskLevel());
        assertTrue(response.getReasons().stream()
                .anyMatch(reason -> "INTERVENTION_REPORT_HISTORY".equals(reason.getCriterion())));
        assertTrue(response.getReasons().stream()
                .anyMatch(reason -> reason.getDetail().contains("Dernier rapport recommande une surveillance")));
        assertTrue(response.getReasons().stream()
                .anyMatch(reason -> reason.getDetail().contains("Cause racine documentee")));
    }

    private Equipment createEquipment(
            Long id,
            String code,
            EquipmentCriticality criticality,
            EquipmentStatus status
    ) {
        Equipment equipment = new Equipment();
        equipment.setId(id);
        equipment.setCode(code);
        equipment.setName("Equipment " + code);
        equipment.setCategory("Production");
        equipment.setLocation("Zone A");
        equipment.setCriticality(criticality);
        equipment.setStatus(status);
        return equipment;
    }

    private Breakdown createBreakdown(Equipment equipment, BreakdownPriority priority, LocalDateTime declaredAt) {
        Breakdown breakdown = new Breakdown();
        breakdown.setEquipment(equipment);
        breakdown.setPriority(priority);
        breakdown.setStatus(BreakdownStatus.DECLARED);
        breakdown.setType(BreakdownType.MECHANICAL);
        breakdown.setDeclaredAt(declaredAt);
        breakdown.setTitle("Test breakdown");
        breakdown.setDescription("Test breakdown description");
        breakdown.setReference("BR-" + equipment.getCode() + "-" + declaredAt.getDayOfMonth());
        return breakdown;
    }

    private WorkOrder createOpenWorkOrder(
            Equipment equipment,
            LocalDateTime createdAt,
            LocalDateTime plannedDate,
            WorkOrderType workOrderType
    ) {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setEquipment(equipment);
        workOrder.setType(workOrderType);
        workOrder.setPriority(WorkOrderPriority.HIGH);
        workOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
        workOrder.setCreatedAt(createdAt);
        workOrder.setPlannedDate(plannedDate);
        workOrder.setDescription("Open work order");
        workOrder.setReference("WO-OPEN-" + equipment.getCode() + "-" + createdAt.getDayOfMonth());
        return workOrder;
    }

    private WorkOrder createCompletedWorkOrder(
            Equipment equipment,
            LocalDateTime createdAt,
            LocalDateTime completedAt,
            WorkOrderType workOrderType
    ) {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setEquipment(equipment);
        workOrder.setType(workOrderType);
        workOrder.setPriority(WorkOrderPriority.MEDIUM);
        workOrder.setStatus(WorkOrderStatus.COMPLETED);
        workOrder.setCreatedAt(createdAt);
        workOrder.setCompletedAt(completedAt);
        workOrder.setDescription("Completed work order");
        workOrder.setReference("WO-COMP-" + equipment.getCode() + "-" + createdAt.getDayOfMonth());
        return workOrder;
    }

    private InterventionReport createInterventionReport(
            Equipment equipment,
            WorkOrder workOrder,
            LocalDateTime closedAt,
            String rootCause,
            String finalResult,
            String futureRecommendations
    ) {
        InterventionReport report = new InterventionReport();
        report.setEquipment(equipment);
        report.setWorkOrder(workOrder);
        report.setClosedAt(closedAt);
        report.setCreatedAt(closedAt);
        report.setPerformedTasks("Diagnostic terrain et controle fonctionnel.");
        report.setRootCause(rootCause);
        report.setFinalResult(finalResult);
        report.setFutureRecommendations(futureRecommendations);
        return report;
    }
}
