package com.edi.gmao.dto.equipment;

import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Representation d'un equipement")
public class EquipmentResponse {

    @Schema(example = "1")
    private Long id;
    @Schema(example = "EQ-001")
    private String code;
    @Schema(example = "Compresseur principal")
    private String name;
    @Schema(example = "Production")
    private String category;
    private String brand;
    private String model;
    private String serialNumber;
    private String location;
    private EquipmentStatus status;
    private EquipmentCriticality criticality;
    private LocalDate installationDate;
    private String description;
}
