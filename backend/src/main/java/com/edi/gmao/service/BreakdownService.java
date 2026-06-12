package com.edi.gmao.service;

import com.edi.gmao.dto.breakdown.BreakdownRequest;
import com.edi.gmao.dto.breakdown.BreakdownResponse;
import com.edi.gmao.dto.breakdown.BreakdownStatusUpdateRequest;
import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.PagedResponseMapper;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import com.edi.gmao.entity.BreakdownType;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.exception.ApiException;
import com.edi.gmao.exception.BreakdownNotFoundException;
import com.edi.gmao.exception.BreakdownReferenceConflictException;
import com.edi.gmao.mapper.BreakdownMapper;
import com.edi.gmao.repository.BreakdownRepository;
import com.edi.gmao.repository.EquipmentRepository;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BreakdownService {

    private final BreakdownRepository breakdownRepository;
    private final EquipmentRepository equipmentRepository;
    private final BreakdownMapper breakdownMapper;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public BreakdownService(
            BreakdownRepository breakdownRepository,
            EquipmentRepository equipmentRepository,
            BreakdownMapper breakdownMapper,
            AuditLogService auditLogService,
            NotificationService notificationService
    ) {
        this.breakdownRepository = breakdownRepository;
        this.equipmentRepository = equipmentRepository;
        this.breakdownMapper = breakdownMapper;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Transactional
    public BreakdownResponse create(BreakdownRequest request) {
        String normalizedReference = normalizeReference(request.getReference());
        if (breakdownRepository.existsByReferenceIgnoreCase(normalizedReference)) {
            throw new BreakdownReferenceConflictException(normalizedReference);
        }

        Equipment equipment = getEquipmentOrThrow(request.getEquipmentId());
        Breakdown breakdown = breakdownMapper.toEntity(request, equipment);
        breakdown.setReference(normalizedReference);

        Breakdown savedBreakdown = breakdownRepository.save(breakdown);
        auditLogService.record(
                "BREAKDOWN_DECLARED",
                "BREAKDOWN",
                savedBreakdown.getId(),
                "Breakdown " + savedBreakdown.getReference() + " declared on equipment " + equipment.getCode()
        );
        notificationService.notifyCriticalBreakdown(savedBreakdown);
        return breakdownMapper.toResponse(savedBreakdown);
    }

    @Transactional(readOnly = true)
    public PagedResponse<BreakdownResponse> findAll(
            String search,
            BreakdownStatus status,
            BreakdownPriority priority,
            BreakdownType type,
            Pageable pageable
    ) {
        Specification<Breakdown> specification = Specification.where(hasSearch(search))
                .and(hasStatus(status))
                .and(hasPriority(priority))
                .and(hasType(type));

        Page<BreakdownResponse> page = breakdownRepository.findAll(specification, pageable)
                .map(breakdownMapper::toResponse);
        return PagedResponseMapper.fromPage(page);
    }

    @Transactional(readOnly = true)
    public BreakdownResponse findById(Long id) {
        Breakdown breakdown = getBreakdownOrThrow(id);
        return breakdownMapper.toResponse(breakdown);
    }

    @Transactional
    public BreakdownResponse update(Long id, BreakdownRequest request) {
        Breakdown existingBreakdown = getBreakdownOrThrow(id);
        String requestedReference = normalizeReference(request.getReference());

        breakdownRepository.findByReferenceIgnoreCase(requestedReference)
                .filter(breakdown -> !breakdown.getId().equals(id))
                .ifPresent(breakdown -> {
                    throw new BreakdownReferenceConflictException(requestedReference);
                });

        Equipment equipment = getEquipmentOrThrow(request.getEquipmentId());
        breakdownMapper.applyRequestToEntity(request, existingBreakdown, equipment);
        existingBreakdown.setReference(requestedReference);

        Breakdown updatedBreakdown = breakdownRepository.save(existingBreakdown);
        notificationService.notifyCriticalBreakdown(updatedBreakdown);
        return breakdownMapper.toResponse(updatedBreakdown);
    }

    @Transactional
    public BreakdownResponse patchStatus(Long id, BreakdownStatusUpdateRequest request) {
        Breakdown breakdown = getBreakdownOrThrow(id);
        breakdown.setStatus(request.getStatus());
        Breakdown updatedBreakdown = breakdownRepository.save(breakdown);
        return breakdownMapper.toResponse(updatedBreakdown);
    }

    private Breakdown getBreakdownOrThrow(Long id) {
        return breakdownRepository.findById(id)
                .orElseThrow(() -> new BreakdownNotFoundException(id));
    }

    private Equipment getEquipmentOrThrow(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Equipment not found with id: " + id));
    }

    private String normalizeReference(String reference) {
        return reference == null ? null : reference.trim().toUpperCase(Locale.ROOT);
    }

    private Specification<Breakdown> hasStatus(BreakdownStatus status) {
        return (root, query, criteriaBuilder) -> status == null
                ? null
                : criteriaBuilder.equal(root.get("status"), status);
    }

    private Specification<Breakdown> hasSearch(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.isBlank()) {
                return null;
            }

            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("reference")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern)
            );
        };
    }

    private Specification<Breakdown> hasPriority(BreakdownPriority priority) {
        return (root, query, criteriaBuilder) -> priority == null
                ? null
                : criteriaBuilder.equal(root.get("priority"), priority);
    }

    private Specification<Breakdown> hasType(BreakdownType type) {
        return (root, query, criteriaBuilder) -> type == null
                ? null
                : criteriaBuilder.equal(root.get("type"), type);
    }
}
