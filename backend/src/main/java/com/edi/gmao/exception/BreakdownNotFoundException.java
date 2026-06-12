package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class BreakdownNotFoundException extends ApiException {

    public BreakdownNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Breakdown not found with id: " + id);
    }
}
