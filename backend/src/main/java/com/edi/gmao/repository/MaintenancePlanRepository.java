package com.edi.gmao.repository;

import com.edi.gmao.entity.MaintenancePlan;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MaintenancePlanRepository extends JpaRepository<MaintenancePlan, Long>, JpaSpecificationExecutor<MaintenancePlan> {

    @Override
    @EntityGraph(attributePaths = {"equipment"})
    List<MaintenancePlan> findAll();

    @Override
    @EntityGraph(attributePaths = {"equipment"})
    Optional<MaintenancePlan> findById(Long id);

    @EntityGraph(attributePaths = {"equipment"})
    List<MaintenancePlan> findByNextExecutionDateLessThanEqual(LocalDate date);

    @EntityGraph(attributePaths = {"equipment"})
    Page<MaintenancePlan> findAll(Specification<MaintenancePlan> specification, Pageable pageable);
}
