package com.edi.gmao.dto.stock;

import com.edi.gmao.entity.StockMovementType;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockMovementResponse {

    private Long id;
    private StockMovementType type;
    private Integer quantity;
    private LocalDateTime movementDate;
    private Long sparePartId;
    private String sparePartReference;
    private String sparePartName;
    private Integer quantityInStockAfterMovement;
    private boolean minimumThresholdReached;
    private String stockAlert;
}
