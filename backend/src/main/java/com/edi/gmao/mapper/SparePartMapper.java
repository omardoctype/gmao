package com.edi.gmao.mapper;

import com.edi.gmao.dto.sparepart.SparePartRequest;
import com.edi.gmao.dto.sparepart.SparePartResponse;
import com.edi.gmao.entity.SparePart;
import org.springframework.stereotype.Component;

@Component
public class SparePartMapper {

    public SparePart toEntity(SparePartRequest request) {
        SparePart sparePart = new SparePart();
        applyRequestToEntity(request, sparePart);
        return sparePart;
    }

    public void applyRequestToEntity(SparePartRequest request, SparePart sparePart) {
        sparePart.setReference(trim(request.getReference()));
        sparePart.setName(trim(request.getName()));
        sparePart.setCategory(trim(request.getCategory()));
        sparePart.setQuantityInStock(request.getQuantityInStock());
        sparePart.setMinimumThreshold(request.getMinimumThreshold());
        sparePart.setUnitPrice(request.getUnitPrice());
    }

    public SparePartResponse toResponse(SparePart sparePart) {
        boolean thresholdReached = sparePart.getQuantityInStock() <= sparePart.getMinimumThreshold();
        return SparePartResponse.builder()
                .id(sparePart.getId())
                .reference(sparePart.getReference())
                .name(sparePart.getName())
                .category(sparePart.getCategory())
                .quantityInStock(sparePart.getQuantityInStock())
                .minimumThreshold(sparePart.getMinimumThreshold())
                .unitPrice(sparePart.getUnitPrice())
                .minimumThresholdReached(thresholdReached)
                .stockAlert(thresholdReached ? "Minimum threshold reached" : null)
                .build();
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
