package com.edi.gmao.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.edi.gmao.dto.stock.StockMovementRequest;
import com.edi.gmao.dto.stock.StockMovementResponse;
import com.edi.gmao.entity.SparePart;
import com.edi.gmao.entity.StockMovement;
import com.edi.gmao.exception.InsufficientStockException;
import com.edi.gmao.mapper.SparePartMapper;
import com.edi.gmao.mapper.StockMovementMapper;
import com.edi.gmao.repository.SparePartRepository;
import com.edi.gmao.repository.StockMovementRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SparePartServiceTest {

    @Mock
    private SparePartRepository sparePartRepository;
    @Mock
    private StockMovementRepository stockMovementRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private NotificationService notificationService;

    private SparePartService sparePartService;

    @BeforeEach
    void setUp() {
        sparePartService = new SparePartService(
                sparePartRepository,
                stockMovementRepository,
                new SparePartMapper(),
                new StockMovementMapper(),
                auditLogService,
                notificationService
        );
    }

    @Test
    void stockIn_shouldIncreaseQuantityAndRecordAudit() {
        SparePart sparePart = buildSparePart(1L, 5, 2);
        StockMovementRequest request = new StockMovementRequest();
        request.setQuantity(3);

        when(sparePartRepository.findById(1L)).thenReturn(Optional.of(sparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> {
            StockMovement movement = invocation.getArgument(0);
            movement.setId(100L);
            return movement;
        });

        StockMovementResponse response = sparePartService.stockIn(1L, request);

        assertEquals(8, response.getQuantityInStockAfterMovement());
        assertEquals(3, response.getQuantity());
        verify(auditLogService).record(
                eq("STOCK_MOVEMENT_IN"),
                eq("SPARE_PART"),
                eq(1L),
                eq("Stock IN +3 for spare part SP-001")
        );
        verify(notificationService).notifyCriticalStock(sparePart);
    }

    @Test
    void stockOut_shouldDecreaseQuantityAndRecordAudit() {
        SparePart sparePart = buildSparePart(1L, 8, 2);
        StockMovementRequest request = new StockMovementRequest();
        request.setQuantity(2);

        when(sparePartRepository.findById(1L)).thenReturn(Optional.of(sparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> {
            StockMovement movement = invocation.getArgument(0);
            movement.setId(101L);
            return movement;
        });

        StockMovementResponse response = sparePartService.stockOut(1L, request);

        assertEquals(6, response.getQuantityInStockAfterMovement());
        assertEquals(2, response.getQuantity());
        verify(auditLogService).record(
                eq("STOCK_MOVEMENT_OUT"),
                eq("SPARE_PART"),
                eq(1L),
                eq("Stock OUT -2 for spare part SP-001")
        );
        verify(notificationService).notifyCriticalStock(sparePart);
    }

    @Test
    void stockOut_shouldThrowWhenRequestedQuantityExceedsStock() {
        SparePart sparePart = buildSparePart(1L, 2, 2);
        StockMovementRequest request = new StockMovementRequest();
        request.setQuantity(5);

        when(sparePartRepository.findById(1L)).thenReturn(Optional.of(sparePart));

        assertThrows(InsufficientStockException.class, () -> sparePartService.stockOut(1L, request));
        verify(stockMovementRepository, never()).save(any(StockMovement.class));
        verify(auditLogService, never()).record(any(), any(), any(), any());
        verify(notificationService, never()).notifyCriticalStock(any(SparePart.class));
    }

    private SparePart buildSparePart(Long id, int quantity, int threshold) {
        SparePart sparePart = new SparePart();
        sparePart.setId(id);
        sparePart.setReference("SP-001");
        sparePart.setName("Roulement");
        sparePart.setCategory("Mecanique");
        sparePart.setQuantityInStock(quantity);
        sparePart.setMinimumThreshold(threshold);
        sparePart.setUnitPrice(BigDecimal.valueOf(25));
        return sparePart;
    }
}
