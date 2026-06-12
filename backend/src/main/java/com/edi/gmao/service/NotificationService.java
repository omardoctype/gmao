package com.edi.gmao.service;

import com.edi.gmao.dto.notification.NotificationResponse;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import com.edi.gmao.entity.Notification;
import com.edi.gmao.entity.NotificationStatus;
import com.edi.gmao.entity.NotificationType;
import com.edi.gmao.entity.SparePart;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.exception.NotificationNotFoundException;
import com.edi.gmao.mapper.NotificationMapper;
import com.edi.gmao.repository.NotificationRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationMapper notificationMapper
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> findAll() {
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> findUnread() {
        return notificationRepository.findByStatusOrderByCreatedAtDesc(NotificationStatus.UNREAD).stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));
        notification.setStatus(NotificationStatus.READ);
        Notification saved = notificationRepository.save(notification);
        return notificationMapper.toResponse(saved);
    }

    @Transactional
    public void notifyCriticalStock(SparePart sparePart) {
        if (sparePart.getQuantityInStock() > sparePart.getMinimumThreshold()) {
            return;
        }

        String eventKey = "CRITICAL_STOCK:" + sparePart.getId() + ":" + sparePart.getQuantityInStock();
        String title = "Seuil de stock critique";
        String message = "La piece " + sparePart.getReference() + " (" + sparePart.getName()
                + ") est en stock critique: " + sparePart.getQuantityInStock()
                + " unite(s) restantes (seuil minimum " + sparePart.getMinimumThreshold() + ").";
        createIfAbsent(NotificationType.CRITICAL_STOCK, title, message, eventKey);
    }

    @Transactional
    public void notifyCriticalBreakdown(Breakdown breakdown) {
        if (breakdown.getPriority() != BreakdownPriority.CRITICAL
                || breakdown.getStatus() == BreakdownStatus.RESOLVED) {
            return;
        }

        String eventKey = "CRITICAL_BREAKDOWN:" + breakdown.getId();
        String title = "Panne critique";
        String message = "La panne " + breakdown.getReference() + " sur l'equipement "
                + breakdown.getEquipment().getCode() + " est marquee CRITICAL.";
        createIfAbsent(NotificationType.CRITICAL_BREAKDOWN, title, message, eventKey);
    }

    @Transactional
    public void notifyOverdueWorkOrder(WorkOrder workOrder) {
        if (workOrder.getPlannedDate() == null) {
            return;
        }
        if (workOrder.getStatus() == WorkOrderStatus.COMPLETED || workOrder.getStatus() == WorkOrderStatus.CANCELLED) {
            return;
        }
        if (!workOrder.getPlannedDate().isBefore(LocalDateTime.now())) {
            return;
        }

        String eventKey = "OVERDUE_WORK_ORDER:" + workOrder.getId() + ":" + workOrder.getPlannedDate();
        String title = "Ordre de travail en retard";
        String message = "L'ordre de travail " + workOrder.getReference() + " (equipement "
                + workOrder.getEquipment().getCode() + ") est en retard depuis "
                + workOrder.getPlannedDate() + " (statut " + workOrder.getStatus() + ").";
        createIfAbsent(NotificationType.OVERDUE_WORK_ORDER, title, message, eventKey);
    }

    private void createIfAbsent(NotificationType type, String title, String message, String eventKey) {
        if (notificationRepository.existsByEventKey(eventKey)) {
            return;
        }

        Notification notification = new Notification();
        notification.setType(type);
        notification.setTitle(trimToLength(title, 150));
        notification.setMessage(trimToLength(message, 2000));
        notification.setStatus(NotificationStatus.UNREAD);
        notification.setEventKey(trimToLength(eventKey, 200));
        try {
            Notification saved = notificationRepository.save(notification);
            LOGGER.info(
                    "Notification created: id={} type={} title={}",
                    saved.getId(),
                    saved.getType(),
                    saved.getTitle()
            );
        } catch (DataIntegrityViolationException ex) {
            LOGGER.debug("Notification already exists for eventKey={}", eventKey);
        }
    }

    private String trimToLength(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
