package com.edi.gmao.repository;

import com.edi.gmao.entity.Notification;
import com.edi.gmao.entity.NotificationStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findAllByOrderByCreatedAtDesc();

    List<Notification> findByStatusOrderByCreatedAtDesc(NotificationStatus status);

    boolean existsByEventKey(String eventKey);
}
