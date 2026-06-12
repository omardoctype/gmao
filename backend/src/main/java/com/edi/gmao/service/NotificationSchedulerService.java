package com.edi.gmao.service;

import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.repository.WorkOrderRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class NotificationSchedulerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationSchedulerService.class);

    private static final List<WorkOrderStatus> OVERDUE_STATUSES = List.of(
            WorkOrderStatus.CREATED,
            WorkOrderStatus.ASSIGNED,
            WorkOrderStatus.IN_PROGRESS
    );

    private final WorkOrderRepository workOrderRepository;
    private final NotificationService notificationService;

    public NotificationSchedulerService(
            WorkOrderRepository workOrderRepository,
            NotificationService notificationService
    ) {
        this.workOrderRepository = workOrderRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(
            fixedDelayString = "${app.scheduler.notifications.overdue-work-orders.fixed-delay-ms:60000}",
            initialDelayString = "${app.scheduler.notifications.overdue-work-orders.initial-delay-ms:20000}"
    )
    public void generateOverdueWorkOrderNotifications() {
        LocalDateTime now = LocalDateTime.now();
        List<WorkOrder> overdueWorkOrders = workOrderRepository.findByPlannedDateBeforeAndStatusIn(now, OVERDUE_STATUSES);

        if (overdueWorkOrders.isEmpty()) {
            LOGGER.debug("Notification scheduler: no overdue work orders found.");
            return;
        }

        LOGGER.info("Notification scheduler: {} overdue work order(s) detected.", overdueWorkOrders.size());
        for (WorkOrder workOrder : overdueWorkOrders) {
            try {
                notificationService.notifyOverdueWorkOrder(workOrder);
            } catch (RuntimeException ex) {
                LOGGER.error(
                        "Notification scheduler: failed to generate overdue notification for work order id={}.",
                        workOrder.getId(),
                        ex
                );
            }
        }
    }
}
