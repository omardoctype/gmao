package com.edi.gmao.dto;

import java.util.List;
import org.springframework.data.domain.Page;

public final class PagedResponseMapper {

    private PagedResponseMapper() {
    }

    public static <T> PagedResponse<T> fromPage(Page<T> page) {
        List<String> sortOrders = page.getSort().stream()
                .map(order -> order.getProperty() + "," + order.getDirection().name().toLowerCase())
                .toList();

        return PagedResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .sort(sortOrders)
                .build();
    }
}
