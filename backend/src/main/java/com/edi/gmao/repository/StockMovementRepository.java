package com.edi.gmao.repository;

import com.edi.gmao.entity.StockMovement;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    @EntityGraph(attributePaths = {"sparePart"})
    List<StockMovement> findAllByOrderByMovementDateDesc();
}
