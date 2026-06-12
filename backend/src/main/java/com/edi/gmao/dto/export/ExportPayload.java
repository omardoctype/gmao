package com.edi.gmao.dto.export;

public record ExportPayload(
        String fileName,
        String contentType,
        byte[] content
) {
}
