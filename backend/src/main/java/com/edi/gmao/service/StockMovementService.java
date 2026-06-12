package com.edi.gmao.service;

import com.edi.gmao.dto.stock.StockMovementResponse;
import com.edi.gmao.mapper.StockMovementMapper;
import com.edi.gmao.repository.StockMovementRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockMovementService {

    private final StockMovementRepository stockMovementRepository;
    private final StockMovementMapper stockMovementMapper;

    public StockMovementService(
            StockMovementRepository stockMovementRepository,
            StockMovementMapper stockMovementMapper
    ) {
        this.stockMovementRepository = stockMovementRepository;
        this.stockMovementMapper = stockMovementMapper;
    }

    @Transactional(readOnly = true)
    public List<StockMovementResponse> findAll() {
        return stockMovementRepository.findAllByOrderByMovementDateDesc().stream()
                .map(stockMovementMapper::toResponse)
                .toList();
    }
}
