package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class BreakdownReferenceConflictException extends ApiException {

    public BreakdownReferenceConflictException(String reference) {
        super(HttpStatus.CONFLICT, "Breakdown reference already exists: " + reference);
    }
}
