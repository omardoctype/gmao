package com.edi.gmao.repository;

import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderStatus;
import java.time.LocalDateTime;
import java.util.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long>, JpaSpecificationExecutor<WorkOrder> {

    boolean existsByReferenceIgnoreCase(String reference);

    Optional<WorkOrder> findByReferenceIgnoreCase(String reference);

    @Override
    @EntityGraph(attributePaths = {"equipment", "breakdown", "assignedTechnician"})
    List<WorkOrder> findAll();

    @Override
    @EntityGraph(attributePaths = {"equipment", "breakdown", "assignedTechnician"})
    Optional<WorkOrder> findById(Long id);

    @EntityGraph(attributePaths = {"equipment", "breakdown", "assignedTechnician"})
    List<WorkOrder> findByAssignedTechnicianId(Long technicianId);

    long countByStatus(WorkOrderStatus status);

    @EntityGraph(attributePaths = {"equipment", "assignedTechnician"})
    Page<WorkOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"equipment", "breakdown", "assignedTechnician"})
    Page<WorkOrder> findAll(Specification<WorkOrder> specification, Pageable pageable);

    @EntityGraph(attributePaths = {"equipment", "assignedTechnician"})
    List<WorkOrder> findByPlannedDateBeforeAndStatusIn(LocalDateTime dateTime, Collection<WorkOrderStatus> statuses);
}
