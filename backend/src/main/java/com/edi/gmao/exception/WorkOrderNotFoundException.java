package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class WorkOrderNotFoundException extends ApiException {

    public WorkOrderNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Work order not found with id: " + id);
    }
}
