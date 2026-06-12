package com.edi.gmao.dto.equipmentdocument;

import com.edi.gmao.entity.EquipmentDocumentType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload multipart pour upload de document equipement")
public class EquipmentDocumentUploadRequest {

    @NotNull
    @Schema(description = "Type du document", example = "MANUEL_MACHINE")
    private EquipmentDocumentType documentType;

    @Schema(description = "Indique si le document a ete genere par IA", example = "false")
    private Boolean generatedByAi = Boolean.FALSE;

    @NotNull
    @Schema(description = "Fichier a uploader")
    private MultipartFile file;
}
