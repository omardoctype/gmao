package com.edi.gmao.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.edi.gmao.dto.notification.NotificationResponse;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.entity.Notification;
import com.edi.gmao.entity.NotificationStatus;
import com.edi.gmao.entity.SparePart;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import com.edi.gmao.mapper.NotificationMapper;
import com.edi.gmao.repository.NotificationRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, new NotificationMapper());
    }

    @Test
    void markAsRead_shouldUpdateNotificationStatus() {
        Notification notification = new Notification();
        notification.setId(1L);
        notification.setStatus(NotificationStatus.UNREAD);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead(1L);

        assertEquals(NotificationStatus.READ, response.getStatus());
        verify(notificationRepository).save(notification);
    }

    @Test
    void notifyCriticalStock_shouldCreateNotificationWhenThresholdReached() {
        SparePart sparePart = new SparePart();
        sparePart.setId(7L);
        sparePart.setReference("SP-007");
        sparePart.setName("Filtre");
        sparePart.setCategory("Hydraulique");
        sparePart.setQuantityInStock(2);
        sparePart.setMinimumThreshold(2);
        sparePart.setUnitPrice(BigDecimal.TEN);

        when(notificationRepository.existsByEventKey("CRITICAL_STOCK:7:2")).thenReturn(false);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        notificationService.notifyCriticalStock(sparePart);

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyOverdueWorkOrder_shouldSkipWhenAlreadyNotified() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(14L);
        workOrder.setReference("OT-014");
        workOrder.setType(WorkOrderType.PREVENTIVE);
        workOrder.setPriority(WorkOrderPriority.HIGH);
        workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        workOrder.setPlannedDate(LocalDateTime.now().minusDays(1));
        workOrder.setDescription("Intervention");
        workOrder.setEquipment(buildEquipment());

        when(notificationRepository.existsByEventKey(startsWith("OVERDUE_WORK_ORDER:14:"))).thenReturn(true);

        notificationService.notifyOverdueWorkOrder(workOrder);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    private Equipment buildEquipment() {
        Equipment equipment = new Equipment();
        equipment.setId(1L);
        equipment.setCode("EQ-001");
        equipment.setName("Compresseur");
        equipment.setCategory("Production");
        equipment.setStatus(EquipmentStatus.OPERATIONAL);
        equipment.setCriticality(EquipmentCriticality.HIGH);
        return equipment;
    }
}
