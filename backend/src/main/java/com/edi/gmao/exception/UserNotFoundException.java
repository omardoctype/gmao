package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class UserNotFoundException extends ApiException {

    public UserNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "User not found with id: " + id);
    }
}
