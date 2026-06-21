package com.edi.gmao.dto.attachment;

import com.edi.gmao.entity.AttachmentCategory;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AttachmentUpdateRequest {

    private AttachmentCategory category;

    @Size(max = 1000)
    private String description;

    @PositiveOrZero
    private Integer displayOrder;
}
