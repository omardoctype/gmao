package com.edi.gmao.repository;

import com.edi.gmao.entity.Equipment;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface EquipmentRepository extends JpaRepository<Equipment, Long>, JpaSpecificationExecutor<Equipment> {

    boolean existsByCodeIgnoreCase(String code);

    Optional<Equipment> findByCodeIgnoreCase(String code);
}
