package com.edi.gmao.dto.stock;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Payload pour mouvement de stock (entree/sortie)")
public class StockMovementRequest {

    @NotNull
    @Min(1)
    @Schema(description = "Quantite a ajouter/retirer", example = "3")
    private Integer quantity;
}
