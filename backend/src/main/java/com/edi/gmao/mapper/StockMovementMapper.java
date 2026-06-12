package com.edi.gmao.mapper;

import com.edi.gmao.dto.stock.StockMovementResponse;
import com.edi.gmao.entity.SparePart;
import com.edi.gmao.entity.StockMovement;
import org.springframework.stereotype.Component;

@Component
public class StockMovementMapper {

    public StockMovementResponse toResponse(StockMovement stockMovement) {
        SparePart sparePart = stockMovement.getSparePart();
        boolean thresholdReached = sparePart.getQuantityInStock() <= sparePart.getMinimumThreshold();

        return StockMovementResponse.builder()
                .id(stockMovement.getId())
                .type(stockMovement.getType())
                .quantity(stockMovement.getQuantity())
                .movementDate(stockMovement.getMovementDate())
                .sparePartId(sparePart.getId())
                .sparePartReference(sparePart.getReference())
                .sparePartName(sparePart.getName())
                .quantityInStockAfterMovement(sparePart.getQuantityInStock())
                .minimumThresholdReached(thresholdReached)
                .stockAlert(thresholdReached ? "Minimum threshold reached" : null)
                .build();
    }
}
