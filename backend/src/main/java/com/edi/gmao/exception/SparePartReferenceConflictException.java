package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class SparePartReferenceConflictException extends ApiException {

    public SparePartReferenceConflictException(String reference) {
        super(HttpStatus.CONFLICT, "Spare part reference already exists: " + reference);
    }
}
