package com.edi.gmao.dto.attachment;

import com.edi.gmao.entity.AttachmentCategory;
import com.edi.gmao.entity.AttachmentEntityType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
public class AttachmentUploadRequest {

    @NotNull
    private AttachmentEntityType entityType;

    @NotNull
    @Positive
    private Long entityId;

    @NotNull
    private AttachmentCategory category;

    @Size(max = 1000)
    private String description;

    @PositiveOrZero
    private Integer displayOrder;

    @NotNull
    private List<MultipartFile> files;
}
