package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class InsufficientStockException extends ApiException {

    public InsufficientStockException(String reference, Integer availableQuantity, Integer requestedQuantity) {
        super(
                HttpStatus.BAD_REQUEST,
                "Insufficient stock for spare part " + reference
                        + " (available: " + availableQuantity
                        + ", requested: " + requestedQuantity + ")"
        );
    }
}
