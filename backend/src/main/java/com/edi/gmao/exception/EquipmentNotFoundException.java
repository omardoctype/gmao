package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class EquipmentNotFoundException extends ApiException {

    public EquipmentNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Equipment not found with id: " + id);
    }
}
