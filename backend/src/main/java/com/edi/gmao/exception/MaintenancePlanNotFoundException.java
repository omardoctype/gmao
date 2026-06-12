package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class MaintenancePlanNotFoundException extends ApiException {

    public MaintenancePlanNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Maintenance plan not found with id: " + id);
    }
}
