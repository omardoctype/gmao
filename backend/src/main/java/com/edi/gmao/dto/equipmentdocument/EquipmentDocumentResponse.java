package com.edi.gmao.dto.equipmentdocument;

import com.edi.gmao.entity.EquipmentDocumentType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Metadonnees d'un document associe a un equipement")
public class EquipmentDocumentResponse {

    @Schema(example = "15")
    private Long id;
    @Schema(example = "manuel_presse_hydraulique_hp200.md")
    private String originalFileName;
    @Schema(example = "4f8e82b8b3ca47d1a7f8a7adf9d4dfd0.md")
    private String storedFileName;
    @Schema(example = "text/markdown")
    private String contentType;
    @Schema(example = "12450")
    private Long size;
    @Schema(example = "MANUEL_MACHINE")
    private EquipmentDocumentType documentType;
    @Schema(example = "1/4f8e82b8b3ca47d1a7f8a7adf9d4dfd0.md")
    private String storagePath;
    @Schema(example = "2026-05-23T12:55:30Z")
    private Instant uploadedAt;
    @Schema(example = "false")
    private boolean generatedByAi;
}
