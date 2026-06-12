package com.edi.gmao.dto.sparepart;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload de creation/mise a jour d'une piece de rechange")
public class SparePartRequest {

    @NotBlank
    @Size(max = 50)
    @Schema(description = "Reference unique", example = "SP-001")
    private String reference;

    @NotBlank
    @Size(max = 150)
    @Schema(description = "Nom de la piece", example = "Roulement SKF 6204")
    private String name;

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Categorie", example = "Mecanique")
    private String category;

    @NotNull
    @Min(0)
    @Schema(description = "Quantite en stock", example = "25")
    private Integer quantityInStock;

    @NotNull
    @Min(0)
    @Schema(description = "Seuil minimum", example = "5")
    private Integer minimumThreshold;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    @Schema(description = "Prix unitaire", example = "18.50")
    private BigDecimal unitPrice;
}
