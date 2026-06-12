package com.edi.gmao.mapper;

import com.edi.gmao.dto.equipmentdocument.EquipmentDocumentResponse;
import com.edi.gmao.entity.EquipmentDocument;
import org.springframework.stereotype.Component;

@Component
public class EquipmentDocumentMapper {

    public EquipmentDocumentResponse toResponse(EquipmentDocument document) {
        return EquipmentDocumentResponse.builder()
                .id(document.getId())
                .originalFileName(document.getOriginalFileName())
                .storedFileName(document.getStoredFileName())
                .contentType(document.getContentType())
                .size(document.getSize())
                .documentType(document.getDocumentType())
                .storagePath(document.getStoragePath())
                .uploadedAt(document.getUploadedAt())
                .generatedByAi(document.isGeneratedByAi())
                .build();
    }
}
