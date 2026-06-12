package com.edi.gmao.repository;

import com.edi.gmao.entity.EquipmentDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EquipmentDocumentRepository extends JpaRepository<EquipmentDocument, Long> {

    List<EquipmentDocument> findByEquipmentIdOrderByUploadedAtDesc(Long equipmentId);

    Optional<EquipmentDocument> findByIdAndEquipmentId(Long documentId, Long equipmentId);
}
