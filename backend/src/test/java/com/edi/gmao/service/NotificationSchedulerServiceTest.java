package com.edi.gmao.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import com.edi.gmao.repository.WorkOrderRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationSchedulerServiceTest {

    @Mock
    private WorkOrderRepository workOrderRepository;
    @Mock
    private NotificationService notificationService;

    private NotificationSchedulerService notificationSchedulerService;

    @BeforeEach
    void setUp() {
        notificationSchedulerService = new NotificationSchedulerService(workOrderRepository, notificationService);
    }

    @Test
    void generateOverdueWorkOrderNotifications_shouldNotifyForOverdueWorkOrders() {
        WorkOrder workOrder = buildOverdueWorkOrder();
        when(workOrderRepository.findByPlannedDateBeforeAndStatusIn(any(LocalDateTime.class), any()))
                .thenReturn(List.of(workOrder));

        notificationSchedulerService.generateOverdueWorkOrderNotifications();

        verify(notificationService).notifyOverdueWorkOrder(workOrder);
    }

    @Test
    void generateOverdueWorkOrderNotifications_shouldDoNothingWhenNoOverdueWorkOrders() {
        when(workOrderRepository.findByPlannedDateBeforeAndStatusIn(any(LocalDateTime.class), any()))
                .thenReturn(List.of());

        notificationSchedulerService.generateOverdueWorkOrderNotifications();

        verify(notificationService, never()).notifyOverdueWorkOrder(any(WorkOrder.class));
    }

    private WorkOrder buildOverdueWorkOrder() {
        Equipment equipment = new Equipment();
        equipment.setId(1L);
        equipment.setCode("EQ-001");
        equipment.setName("Compresseur");
        equipment.setCategory("Production");
        equipment.setStatus(EquipmentStatus.OPERATIONAL);
        equipment.setCriticality(EquipmentCriticality.HIGH);

        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(10L);
        workOrder.setReference("OT-010");
        workOrder.setType(WorkOrderType.CORRECTIVE);
        workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        workOrder.setPriority(WorkOrderPriority.HIGH);
        workOrder.setPlannedDate(LocalDateTime.now().minusHours(5));
        workOrder.setDescription("Intervention");
        workOrder.setEquipment(equipment);
        return workOrder;
    }
}
