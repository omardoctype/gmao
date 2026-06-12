package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class EquipmentCodeConflictException extends ApiException {

    public EquipmentCodeConflictException(String code) {
        super(HttpStatus.CONFLICT, "Equipment code already exists: " + code);
    }
}
