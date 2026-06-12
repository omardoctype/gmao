package com.edi.gmao.dto.equipment;

import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload de creation/mise a jour d'un equipement")
public class EquipmentRequest {

    @NotBlank
    @Size(max = 50)
    @Schema(description = "Code unique de l'equipement", example = "EQ-001")
    private String code;

    @NotBlank
    @Size(max = 150)
    @Schema(description = "Nom de l'equipement", example = "Compresseur principal")
    private String name;

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Categorie de l'equipement", example = "Production")
    private String category;

    @Size(max = 100)
    @Schema(description = "Marque", example = "Atlas Copco")
    private String brand;

    @Size(max = 100)
    @Schema(description = "Modele", example = "GA55")
    private String model;

    @Size(max = 100)
    @Schema(description = "Numero de serie", example = "SN-AC-2026-001")
    private String serialNumber;

    @Size(max = 150)
    @Schema(description = "Localisation", example = "Atelier A - Ligne 1")
    private String location;

    @NotNull
    @Schema(description = "Statut operationnel", example = "OPERATIONAL")
    private EquipmentStatus status;

    @NotNull
    @Schema(description = "Criticite metier", example = "HIGH")
    private EquipmentCriticality criticality;

    @Schema(description = "Date d'installation", example = "2024-03-10")
    private LocalDate installationDate;

    @Size(max = 2000)
    @Schema(description = "Description libre", example = "Compresseur air principal de la ligne")
    private String description;
}
