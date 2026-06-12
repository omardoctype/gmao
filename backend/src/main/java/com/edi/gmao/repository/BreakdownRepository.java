package com.edi.gmao.repository;

import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BreakdownRepository extends JpaRepository<Breakdown, Long>, JpaSpecificationExecutor<Breakdown> {

    boolean existsByReferenceIgnoreCase(String reference);

    Optional<Breakdown> findByReferenceIgnoreCase(String reference);

    long countByStatusNot(BreakdownStatus status);

    @Override
    @EntityGraph(attributePaths = {"equipment"})
    List<Breakdown> findAll();

    @EntityGraph(attributePaths = {"equipment"})
    Page<Breakdown> findAll(Specification<Breakdown> specification, Pageable pageable);

    @EntityGraph(attributePaths = {"equipment"})
    @Query("""
            select b from Breakdown b
            where b.status <> :resolvedStatus
            and b.priority in :priorities
            order by
                case
                    when b.priority = com.edi.gmao.entity.BreakdownPriority.CRITICAL then 0
                    when b.priority = com.edi.gmao.entity.BreakdownPriority.HIGH then 1
                    else 2
                end,
                b.declaredAt desc
            """)
    List<Breakdown> findPriorityBreakdowns(
            @Param("resolvedStatus") BreakdownStatus resolvedStatus,
            @Param("priorities") List<BreakdownPriority> priorities,
            Pageable pageable
    );
}
