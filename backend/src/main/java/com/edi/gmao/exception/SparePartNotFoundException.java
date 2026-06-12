package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class SparePartNotFoundException extends ApiException {

    public SparePartNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Spare part not found with id: " + id);
    }
}
