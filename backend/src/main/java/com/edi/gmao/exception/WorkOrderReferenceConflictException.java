package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class WorkOrderReferenceConflictException extends ApiException {

    public WorkOrderReferenceConflictException(String reference) {
        super(HttpStatus.CONFLICT, "Work order reference already exists: " + reference);
    }
}
