package com.edi.gmao.dto.sparepart;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SparePartResponse {

    private Long id;
    private String reference;
    private String name;
    private String category;
    private Integer quantityInStock;
    private Integer minimumThreshold;
    private BigDecimal unitPrice;
    private boolean minimumThresholdReached;
    private String stockAlert;
}
