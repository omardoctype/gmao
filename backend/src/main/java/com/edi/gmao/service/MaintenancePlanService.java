package com.edi.gmao.service;

import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.PagedResponseMapper;
import com.edi.gmao.dto.maintenanceplan.MaintenancePlanRequest;
import com.edi.gmao.dto.maintenanceplan.MaintenancePlanResponse;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.MaintenancePlan;
import com.edi.gmao.entity.MaintenancePlanFrequency;
import com.edi.gmao.entity.MaintenancePlanType;
import com.edi.gmao.exception.ApiException;
import com.edi.gmao.exception.MaintenancePlanNotFoundException;
import com.edi.gmao.mapper.MaintenancePlanMapper;
import com.edi.gmao.repository.EquipmentRepository;
import com.edi.gmao.repository.MaintenancePlanRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MaintenancePlanService {

    private final MaintenancePlanRepository maintenancePlanRepository;
    private final EquipmentRepository equipmentRepository;
    private final MaintenancePlanMapper maintenancePlanMapper;

    public MaintenancePlanService(
            MaintenancePlanRepository maintenancePlanRepository,
            EquipmentRepository equipmentRepository,
            MaintenancePlanMapper maintenancePlanMapper
    ) {
        this.maintenancePlanRepository = maintenancePlanRepository;
        this.equipmentRepository = equipmentRepository;
        this.maintenancePlanMapper = maintenancePlanMapper;
    }

    @Transactional
    public MaintenancePlanResponse create(MaintenancePlanRequest request) {
        Equipment equipment = getEquipmentOrThrow(request.getEquipmentId());
        MaintenancePlan maintenancePlan = maintenancePlanMapper.toEntity(request, equipment);
        MaintenancePlan saved = maintenancePlanRepository.save(maintenancePlan);
        return maintenancePlanMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<MaintenancePlanResponse> findAll(
            MaintenancePlanType type,
            MaintenancePlanFrequency frequency,
            Pageable pageable
    ) {
        Specification<MaintenancePlan> specification = Specification.where(hasType(type))
                .and(hasFrequency(frequency));

        Page<MaintenancePlanResponse> page = maintenancePlanRepository.findAll(specification, pageable)
                .map(maintenancePlanMapper::toResponse);
        return PagedResponseMapper.fromPage(page);
    }

    @Transactional(readOnly = true)
    public MaintenancePlanResponse findById(Long id) {
        MaintenancePlan maintenancePlan = getMaintenancePlanOrThrow(id);
        return maintenancePlanMapper.toResponse(maintenancePlan);
    }

    @Transactional
    public MaintenancePlanResponse update(Long id, MaintenancePlanRequest request) {
        MaintenancePlan existing = getMaintenancePlanOrThrow(id);
        Equipment equipment = getEquipmentOrThrow(request.getEquipmentId());
        maintenancePlanMapper.applyRequestToEntity(request, existing, equipment);
        MaintenancePlan saved = maintenancePlanRepository.save(existing);
        return maintenancePlanMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        MaintenancePlan maintenancePlan = getMaintenancePlanOrThrow(id);
        maintenancePlanRepository.delete(maintenancePlan);
    }

    @Transactional(readOnly = true)
    public List<MaintenancePlanResponse> findPlansDueUntil(LocalDate date) {
        return maintenancePlanRepository.findByNextExecutionDateLessThanEqual(date).stream()
                .map(maintenancePlanMapper::toResponse)
                .toList();
    }

    private MaintenancePlan getMaintenancePlanOrThrow(Long id) {
        return maintenancePlanRepository.findById(id)
                .orElseThrow(() -> new MaintenancePlanNotFoundException(id));
    }

    private Equipment getEquipmentOrThrow(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Equipment not found with id: " + id));
    }

    private Specification<MaintenancePlan> hasType(MaintenancePlanType type) {
        return (root, query, criteriaBuilder) -> type == null
                ? null
                : criteriaBuilder.equal(root.get("type"), type);
    }

    private Specification<MaintenancePlan> hasFrequency(MaintenancePlanFrequency frequency) {
        return (root, query, criteriaBuilder) -> frequency == null
                ? null
                : criteriaBuilder.equal(root.get("frequency"), frequency);
    }
}
