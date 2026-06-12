package com.edi.gmao.exception;

import org.springframework.http.HttpStatus;

public class UserEmailConflictException extends ApiException {

    public UserEmailConflictException(String email) {
        super(HttpStatus.CONFLICT, "User email already exists: " + email);
    }
}
