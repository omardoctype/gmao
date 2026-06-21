package com.edi.gmao.dto.attachment;

public record AttachmentContentPayload(
        byte[] content,
        String mimeType,
        String originalFileName,
        long fileSizeBytes
) {
}
