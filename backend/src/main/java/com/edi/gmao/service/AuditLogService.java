package com.edi.gmao.service;

import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.PagedResponseMapper;
import com.edi.gmao.dto.audit.AuditLogResponse;
import com.edi.gmao.entity.AuditLog;
import com.edi.gmao.entity.User;
import com.edi.gmao.mapper.AuditLogMapper;
import com.edi.gmao.repository.AuditLogRepository;
import com.edi.gmao.repository.UserRepository;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final AuditLogMapper auditLogMapper;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            UserRepository userRepository,
            AuditLogMapper auditLogMapper
    ) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.auditLogMapper = auditLogMapper;
    }

    @Transactional
    public void record(String action, String entityType, Long entityId, String details) {
        try {
            AuditActor actor = resolveCurrentActor();

            AuditLog auditLog = new AuditLog();
            auditLog.setAction(normalizeUpper(action, 100));
            auditLog.setEntityType(normalizeUpper(entityType, 100));
            auditLog.setEntityId(entityId);
            auditLog.setUserId(actor.userId());
            auditLog.setUsername(trimToLength(actor.username(), 255));
            auditLog.setDetails(trimToLength(details, 2000));
            auditLogRepository.save(auditLog);
        } catch (RuntimeException ex) {
            LOGGER.warn("Failed to persist audit log for action={} entityType={} entityId={}", action, entityType, entityId, ex);
        }
    }

    @Transactional(readOnly = true)
    public PagedResponse<AuditLogResponse> findAll(String action, String entityType, String username, Pageable pageable) {
        Specification<AuditLog> specification = Specification.where(hasAction(action))
                .and(hasEntityType(entityType))
                .and(hasUsername(username));

        Page<AuditLogResponse> page = auditLogRepository.findAll(specification, pageable)
                .map(auditLogMapper::toResponse);
        return PagedResponseMapper.fromPage(page);
    }

    private Specification<AuditLog> hasAction(String action) {
        return (root, query, criteriaBuilder) -> {
            if (action == null || action.isBlank()) {
                return null;
            }
            return criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("action")),
                    action.trim().toLowerCase(Locale.ROOT)
            );
        };
    }

    private Specification<AuditLog> hasEntityType(String entityType) {
        return (root, query, criteriaBuilder) -> {
            if (entityType == null || entityType.isBlank()) {
                return null;
            }
            return criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("entityType")),
                    entityType.trim().toLowerCase(Locale.ROOT)
            );
        };
    }

    private Specification<AuditLog> hasUsername(String username) {
        return (root, query, criteriaBuilder) -> {
            if (username == null || username.isBlank()) {
                return null;
            }
            return criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("username")),
                    "%" + username.trim().toLowerCase(Locale.ROOT) + "%"
            );
        };
    }

    private AuditActor resolveCurrentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return new AuditActor(null, "SYSTEM");
        }

        String username = authentication.getName();
        Long userId = userRepository.findByEmailIgnoreCase(username)
                .map(User::getId)
                .orElse(null);
        return new AuditActor(userId, username);
    }

    private String normalizeUpper(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return trimToLength(value.trim().toUpperCase(Locale.ROOT), maxLength);
    }

    private String trimToLength(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private record AuditActor(Long userId, String username) {
    }
}
