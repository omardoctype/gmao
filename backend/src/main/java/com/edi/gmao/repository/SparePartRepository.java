package com.edi.gmao.repository;

import com.edi.gmao.entity.SparePart;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface SparePartRepository extends JpaRepository<SparePart, Long>, JpaSpecificationExecutor<SparePart> {

    boolean existsByReferenceIgnoreCase(String reference);

    Optional<SparePart> findByReferenceIgnoreCase(String reference);

    @Query("select count(sp) from SparePart sp where sp.quantityInStock <= sp.minimumThreshold")
    long countCriticalStock();

    @Query("""
            select sp from SparePart sp
            where sp.quantityInStock <= sp.minimumThreshold
            order by (sp.minimumThreshold - sp.quantityInStock) desc, sp.name asc
            """)
    List<SparePart> findCriticalStock(Pageable pageable);
}
