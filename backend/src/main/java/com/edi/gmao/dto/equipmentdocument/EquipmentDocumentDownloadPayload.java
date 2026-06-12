package com.edi.gmao.dto.equipmentdocument;

public record EquipmentDocumentDownloadPayload(
        byte[] content,
        String contentType,
        String originalFileName,
        long size
) {
}
