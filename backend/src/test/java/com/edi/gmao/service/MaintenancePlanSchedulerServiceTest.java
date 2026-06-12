package com.edi.gmao.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.entity.MaintenancePlan;
import com.edi.gmao.entity.MaintenancePlanFrequency;
import com.edi.gmao.entity.MaintenancePlanType;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import com.edi.gmao.repository.MaintenancePlanRepository;
import com.edi.gmao.repository.WorkOrderRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MaintenancePlanSchedulerServiceTest {

    @Mock
    private MaintenancePlanRepository maintenancePlanRepository;
    @Mock
    private WorkOrderRepository workOrderRepository;
    @Mock
    private AuditLogService auditLogService;

    private MaintenancePlanSchedulerService schedulerService;

    @BeforeEach
    void setUp() {
        schedulerService = new MaintenancePlanSchedulerService(
                maintenancePlanRepository,
                workOrderRepository,
                auditLogService
        );
    }

    @Test
    void generateWorkOrdersForDuePlans_shouldCreateWorkOrderAndAdvanceNextDate() {
        LocalDate dueDate = LocalDate.now();
        Equipment equipment = buildEquipment(5L, "EQ-005", "Convoyeur");
        MaintenancePlan plan = buildPlan(
                11L,
                dueDate,
                MaintenancePlanFrequency.WEEKLY,
                MaintenancePlanType.PREVENTIVE,
                equipment,
                "Controle preventif hebdomadaire"
        );
        String expectedReference = "MP-11-" + dueDate.format(DateTimeFormatter.BASIC_ISO_DATE);

        when(maintenancePlanRepository.findByNextExecutionDateLessThanEqual(any(LocalDate.class)))
                .thenReturn(List.of(plan));
        when(workOrderRepository.existsByReferenceIgnoreCase(expectedReference)).thenReturn(false);
        when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(invocation -> {
            WorkOrder workOrder = invocation.getArgument(0);
            workOrder.setId(501L);
            return workOrder;
        });
        when(maintenancePlanRepository.save(any(MaintenancePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        schedulerService.generateWorkOrdersForDuePlans();

        ArgumentCaptor<WorkOrder> workOrderCaptor = ArgumentCaptor.forClass(WorkOrder.class);
        verify(workOrderRepository).save(workOrderCaptor.capture());
        WorkOrder generated = workOrderCaptor.getValue();

        assertEquals(expectedReference, generated.getReference());
        assertEquals(WorkOrderType.PREVENTIVE, generated.getType());
        assertEquals(WorkOrderStatus.CREATED, generated.getStatus());
        assertEquals(WorkOrderPriority.MEDIUM, generated.getPriority());
        assertEquals(dueDate.atStartOfDay(), generated.getPlannedDate());
        assertEquals(equipment, generated.getEquipment());

        assertEquals(dueDate.plusWeeks(1), plan.getNextExecutionDate());
        verify(maintenancePlanRepository).save(plan);
        verify(auditLogService).record(
                eq("WORK_ORDER_AUTO_GENERATED"),
                eq("WORK_ORDER"),
                eq(501L),
                contains("maintenance plan #11")
        );
    }

    @Test
    void generateWorkOrdersForDuePlans_shouldSkipDuplicateAndStillAdvanceNextDate() {
        LocalDate dueDate = LocalDate.now();
        Equipment equipment = buildEquipment(6L, "EQ-006", "Pompe");
        MaintenancePlan plan = buildPlan(
                22L,
                dueDate,
                MaintenancePlanFrequency.DAILY,
                MaintenancePlanType.LEGAL,
                equipment,
                "Controle legal quotidien"
        );
        String expectedReference = "MP-22-" + dueDate.format(DateTimeFormatter.BASIC_ISO_DATE);

        when(maintenancePlanRepository.findByNextExecutionDateLessThanEqual(any(LocalDate.class)))
                .thenReturn(List.of(plan));
        when(workOrderRepository.existsByReferenceIgnoreCase(expectedReference)).thenReturn(true);
        when(maintenancePlanRepository.save(any(MaintenancePlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        schedulerService.generateWorkOrdersForDuePlans();

        verify(workOrderRepository, never()).save(any(WorkOrder.class));
        verify(auditLogService, never()).record(any(), any(), any(), any());
        assertEquals(dueDate.plusDays(1), plan.getNextExecutionDate());
        verify(maintenancePlanRepository).save(plan);
    }

    private Equipment buildEquipment(Long id, String code, String name) {
        Equipment equipment = new Equipment();
        equipment.setId(id);
        equipment.setCode(code);
        equipment.setName(name);
        equipment.setCategory("Production");
        equipment.setStatus(EquipmentStatus.OPERATIONAL);
        equipment.setCriticality(EquipmentCriticality.MEDIUM);
        return equipment;
    }

    private MaintenancePlan buildPlan(
            Long id,
            LocalDate nextExecutionDate,
            MaintenancePlanFrequency frequency,
            MaintenancePlanType type,
            Equipment equipment,
            String description
    ) {
        MaintenancePlan plan = new MaintenancePlan();
        plan.setId(id);
        plan.setType(type);
        plan.setFrequency(frequency);
        plan.setNextExecutionDate(nextExecutionDate);
        plan.setDescription(description);
        plan.setEquipment(equipment);
        return plan;
    }
}
