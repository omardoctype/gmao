package com.edi.gmao.service;

import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.PagedResponseMapper;
import com.edi.gmao.dto.sparepart.SparePartRequest;
import com.edi.gmao.dto.sparepart.SparePartResponse;
import com.edi.gmao.dto.stock.StockMovementRequest;
import com.edi.gmao.dto.stock.StockMovementResponse;
import com.edi.gmao.entity.SparePart;
import com.edi.gmao.entity.StockMovement;
import com.edi.gmao.entity.StockMovementType;
import com.edi.gmao.exception.InsufficientStockException;
import com.edi.gmao.exception.SparePartNotFoundException;
import com.edi.gmao.exception.SparePartReferenceConflictException;
import com.edi.gmao.mapper.SparePartMapper;
import com.edi.gmao.mapper.StockMovementMapper;
import com.edi.gmao.repository.SparePartRepository;
import com.edi.gmao.repository.StockMovementRepository;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SparePartService {

    private final SparePartRepository sparePartRepository;
    private final StockMovementRepository stockMovementRepository;
    private final SparePartMapper sparePartMapper;
    private final StockMovementMapper stockMovementMapper;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public SparePartService(
            SparePartRepository sparePartRepository,
            StockMovementRepository stockMovementRepository,
            SparePartMapper sparePartMapper,
            StockMovementMapper stockMovementMapper,
            AuditLogService auditLogService,
            NotificationService notificationService
    ) {
        this.sparePartRepository = sparePartRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.sparePartMapper = sparePartMapper;
        this.stockMovementMapper = stockMovementMapper;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Transactional
    public SparePartResponse create(SparePartRequest request) {
        String normalizedReference = normalizeReference(request.getReference());
        if (sparePartRepository.existsByReferenceIgnoreCase(normalizedReference)) {
            throw new SparePartReferenceConflictException(normalizedReference);
        }

        SparePart sparePart = sparePartMapper.toEntity(request);
        sparePart.setReference(normalizedReference);
        SparePart saved = sparePartRepository.save(sparePart);
        return sparePartMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<SparePartResponse> findAll(
            String search,
            String category,
            Integer minimumThreshold,
            Pageable pageable
    ) {
        Specification<SparePart> specification = Specification.where(hasSearch(search))
                .and(hasCategory(category))
                .and(hasMinimumThreshold(minimumThreshold));

        Page<SparePartResponse> page = sparePartRepository.findAll(specification, pageable)
                .map(sparePartMapper::toResponse);
        return PagedResponseMapper.fromPage(page);
    }

    @Transactional(readOnly = true)
    public SparePartResponse findById(Long id) {
        SparePart sparePart = getSparePartOrThrow(id);
        return sparePartMapper.toResponse(sparePart);
    }

    @Transactional
    public SparePartResponse update(Long id, SparePartRequest request) {
        SparePart existing = getSparePartOrThrow(id);
        String normalizedReference = normalizeReference(request.getReference());

        sparePartRepository.findByReferenceIgnoreCase(normalizedReference)
                .filter(sparePart -> !sparePart.getId().equals(id))
                .ifPresent(sparePart -> {
                    throw new SparePartReferenceConflictException(normalizedReference);
                });

        sparePartMapper.applyRequestToEntity(request, existing);
        existing.setReference(normalizedReference);
        SparePart saved = sparePartRepository.save(existing);
        return sparePartMapper.toResponse(saved);
    }

    @Transactional
    public StockMovementResponse stockIn(Long sparePartId, StockMovementRequest request) {
        SparePart sparePart = getSparePartOrThrow(sparePartId);

        int newQuantity = sparePart.getQuantityInStock() + request.getQuantity();
        sparePart.setQuantityInStock(newQuantity);
        sparePartRepository.save(sparePart);

        StockMovement stockMovement = new StockMovement();
        stockMovement.setType(StockMovementType.IN);
        stockMovement.setQuantity(request.getQuantity());
        stockMovement.setSparePart(sparePart);

        StockMovement savedMovement = stockMovementRepository.save(stockMovement);
        auditLogService.record(
                "STOCK_MOVEMENT_IN",
                "SPARE_PART",
                sparePart.getId(),
                "Stock IN +" + request.getQuantity() + " for spare part " + sparePart.getReference()
        );
        notificationService.notifyCriticalStock(sparePart);
        return stockMovementMapper.toResponse(savedMovement);
    }

    @Transactional
    public StockMovementResponse stockOut(Long sparePartId, StockMovementRequest request) {
        SparePart sparePart = getSparePartOrThrow(sparePartId);

        if (request.getQuantity() > sparePart.getQuantityInStock()) {
            throw new InsufficientStockException(
                    sparePart.getReference(),
                    sparePart.getQuantityInStock(),
                    request.getQuantity()
            );
        }

        int newQuantity = sparePart.getQuantityInStock() - request.getQuantity();
        sparePart.setQuantityInStock(newQuantity);
        sparePartRepository.save(sparePart);

        StockMovement stockMovement = new StockMovement();
        stockMovement.setType(StockMovementType.OUT);
        stockMovement.setQuantity(request.getQuantity());
        stockMovement.setSparePart(sparePart);

        StockMovement savedMovement = stockMovementRepository.save(stockMovement);
        auditLogService.record(
                "STOCK_MOVEMENT_OUT",
                "SPARE_PART",
                sparePart.getId(),
                "Stock OUT -" + request.getQuantity() + " for spare part " + sparePart.getReference()
        );
        notificationService.notifyCriticalStock(sparePart);
        return stockMovementMapper.toResponse(savedMovement);
    }

    private SparePart getSparePartOrThrow(Long id) {
        return sparePartRepository.findById(id)
                .orElseThrow(() -> new SparePartNotFoundException(id));
    }

    private String normalizeReference(String reference) {
        return reference == null ? null : reference.trim().toUpperCase(Locale.ROOT);
    }

    private Specification<SparePart> hasCategory(String category) {
        return (root, query, criteriaBuilder) -> {
            if (category == null || category.isBlank()) {
                return null;
            }
            return criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("category")),
                    category.trim().toLowerCase(Locale.ROOT)
            );
        };
    }

    private Specification<SparePart> hasSearch(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.isBlank()) {
                return null;
            }

            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("reference")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), pattern)
            );
        };
    }

    private Specification<SparePart> hasMinimumThreshold(Integer minimumThreshold) {
        return (root, query, criteriaBuilder) -> minimumThreshold == null
                ? null
                : criteriaBuilder.equal(root.get("minimumThreshold"), minimumThreshold);
    }
}
