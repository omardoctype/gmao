package com.edi.gmao.repository;

import com.edi.gmao.entity.InterventionReport;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterventionReportRepository extends JpaRepository<InterventionReport, Long> {

    boolean existsByWorkOrderId(Long workOrderId);

    @EntityGraph(attributePaths = {
            "workOrder",
            "equipment",
            "breakdown",
            "technician",
            "equipmentDocument"
    })
    Optional<InterventionReport> findByWorkOrderId(Long workOrderId);

    @EntityGraph(attributePaths = {
            "workOrder",
            "equipment",
            "breakdown",
            "technician",
            "equipmentDocument"
    })
    List<InterventionReport> findTop5ByEquipmentIdOrderByClosedAtDesc(Long equipmentId);
}
