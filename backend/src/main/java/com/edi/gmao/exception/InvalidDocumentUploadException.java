package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class InvalidDocumentUploadException extends ApiException {

    public InvalidDocumentUploadException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
