package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class DocumentStorageException extends ApiException {

    public DocumentStorageException(String message) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }
}
