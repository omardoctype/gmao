package com.edi.gmao.dto.attachment;

import com.edi.gmao.entity.AttachmentCategory;
import com.edi.gmao.entity.AttachmentEntityType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Metadonnees d'une image attachee a une entite metier")
public class AttachmentResponse {

    private Long id;
    private String originalFileName;
    private String storedFileName;
    private String fileUrl;
    private String mimeType;
    private Long fileSizeBytes;
    private Instant uploadedAt;
    private Long uploadedById;
    private String uploadedByName;
    private AttachmentEntityType entityType;
    private Long entityId;
    private AttachmentCategory category;
    private String description;
    private Integer displayOrder;
}
