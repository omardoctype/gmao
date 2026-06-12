package com.edi.gmao.dto.dashboard;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DashboardCriticalStockResponse {

    private Long id;
    private String reference;
    private String name;
    private String category;
    private Integer quantityInStock;
    private Integer minimumThreshold;
    private BigDecimal unitPrice;
}
