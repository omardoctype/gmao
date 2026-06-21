package com.edi.gmao.mapper;

import com.edi.gmao.dto.attachment.AttachmentResponse;
import com.edi.gmao.entity.MediaAttachment;
import com.edi.gmao.entity.User;
import org.springframework.stereotype.Component;

@Component
public class MediaAttachmentMapper {

    public AttachmentResponse toResponse(MediaAttachment attachment) {
        User uploadedBy = attachment.getUploadedBy();
        return AttachmentResponse.builder()
                .id(attachment.getId())
                .originalFileName(attachment.getOriginalFileName())
                .storedFileName(attachment.getStoredFileName())
                .fileUrl(attachment.getFileUrl())
                .mimeType(attachment.getMimeType())
                .fileSizeBytes(attachment.getFileSizeBytes())
                .uploadedAt(attachment.getUploadedAt())
                .uploadedById(uploadedBy == null ? null : uploadedBy.getId())
                .uploadedByName(uploadedBy == null
                        ? null
                        : uploadedBy.getFirstName() + " " + uploadedBy.getLastName())
                .entityType(attachment.getEntityType())
                .entityId(attachment.getEntityId())
                .category(attachment.getCategory())
                .description(attachment.getDescription())
                .displayOrder(attachment.getDisplayOrder())
                .build();
    }
}
