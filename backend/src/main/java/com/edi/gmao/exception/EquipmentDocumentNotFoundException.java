package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class EquipmentDocumentNotFoundException extends ApiException {

    public EquipmentDocumentNotFoundException(Long equipmentId, Long documentId) {
        super(
                HttpStatus.NOT_FOUND,
                "Document not found with id: " + documentId + " for equipment id: " + equipmentId
        );
    }
}
