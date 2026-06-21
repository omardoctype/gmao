package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class AttachmentNotFoundException extends ApiException {

    public AttachmentNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Piece jointe introuvable: " + id);
    }
}
