package com.edi.gmao.service;

import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.PagedResponseMapper;
import com.edi.gmao.dto.equipment.EquipmentRequest;
import com.edi.gmao.dto.equipment.EquipmentResponse;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.exception.EquipmentCodeConflictException;
import com.edi.gmao.exception.EquipmentNotFoundException;
import com.edi.gmao.mapper.EquipmentMapper;
import com.edi.gmao.repository.EquipmentRepository;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentMapper equipmentMapper;
    private final AuditLogService auditLogService;

    public EquipmentService(
            EquipmentRepository equipmentRepository,
            EquipmentMapper equipmentMapper,
            AuditLogService auditLogService
    ) {
        this.equipmentRepository = equipmentRepository;
        this.equipmentMapper = equipmentMapper;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public EquipmentResponse create(EquipmentRequest request) {
        String code = normalize(request.getCode());
        if (equipmentRepository.existsByCodeIgnoreCase(code)) {
            throw new EquipmentCodeConflictException(code);
        }

        Equipment equipment = equipmentMapper.toEntity(request);
        equipment.setCode(code);
        Equipment savedEquipment = equipmentRepository.save(equipment);
        auditLogService.record(
                "EQUIPMENT_CREATED",
                "EQUIPMENT",
                savedEquipment.getId(),
                "Equipment " + savedEquipment.getCode() + " created"
        );
        return equipmentMapper.toResponse(savedEquipment);
    }

    @Transactional(readOnly = true)
    public PagedResponse<EquipmentResponse> findAll(
            String search,
            String name,
            String category,
            EquipmentStatus status,
            EquipmentCriticality criticality,
            Pageable pageable
    ) {
        Specification<Equipment> specification = Specification.where(hasSearch(search))
                .and(hasName(name))
                .and(hasCategory(category))
                .and(hasStatus(status))
                .and(hasCriticality(criticality));

        Page<EquipmentResponse> page = equipmentRepository.findAll(specification, pageable)
                .map(equipmentMapper::toResponse);
        return PagedResponseMapper.fromPage(page);
    }

    @Transactional(readOnly = true)
    public EquipmentResponse findById(Long id) {
        Equipment equipment = getEquipmentOrThrow(id);
        return equipmentMapper.toResponse(equipment);
    }

    @Transactional
    public EquipmentResponse update(Long id, EquipmentRequest request) {
        Equipment existingEquipment = getEquipmentOrThrow(id);

        String requestedCode = normalize(request.getCode());
        equipmentRepository.findByCodeIgnoreCase(requestedCode)
                .filter(equipment -> !equipment.getId().equals(id))
                .ifPresent(equipment -> {
                    throw new EquipmentCodeConflictException(requestedCode);
                });

        equipmentMapper.applyRequestToEntity(request, existingEquipment);
        existingEquipment.setCode(requestedCode);
        Equipment savedEquipment = equipmentRepository.save(existingEquipment);
        auditLogService.record(
                "EQUIPMENT_UPDATED",
                "EQUIPMENT",
                savedEquipment.getId(),
                "Equipment " + savedEquipment.getCode() + " updated"
        );
        return equipmentMapper.toResponse(savedEquipment);
    }

    @Transactional
    public void delete(Long id) {
        Equipment equipment = getEquipmentOrThrow(id);
        equipmentRepository.delete(equipment);
    }

    private Equipment getEquipmentOrThrow(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new EquipmentNotFoundException(id));
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private Specification<Equipment> hasName(String name) {
        return (root, query, criteriaBuilder) -> {
            if (name == null || name.isBlank()) {
                return null;
            }
            return criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("name")),
                    "%" + name.trim().toLowerCase(Locale.ROOT) + "%"
            );
        };
    }

    private Specification<Equipment> hasSearch(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.isBlank()) {
                return null;
            }

            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("code")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("brand")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("model")), pattern)
            );
        };
    }

    private Specification<Equipment> hasCategory(String category) {
        return (root, query, criteriaBuilder) -> {
            if (category == null || category.isBlank()) {
                return null;
            }
            return criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("category")),
                    category.trim().toLowerCase(Locale.ROOT)
            );
        };
    }

    private Specification<Equipment> hasStatus(EquipmentStatus status) {
        return (root, query, criteriaBuilder) -> status == null
                ? null
                : criteriaBuilder.equal(root.get("status"), status);
    }

    private Specification<Equipment> hasCriticality(EquipmentCriticality criticality) {
        return (root, query, criteriaBuilder) -> criticality == null
                ? null
                : criteriaBuilder.equal(root.get("criticality"), criticality);
    }
}
