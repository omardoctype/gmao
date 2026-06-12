package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class NotificationNotFoundException extends ApiException {

    public NotificationNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Notification not found with id: " + id);
    }
}
