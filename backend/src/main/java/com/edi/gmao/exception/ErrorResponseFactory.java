package com.edi.gmao.exception;

import java.util.Collections;
import java.util.Map;
import org.springframework.http.HttpStatus;

public final class ErrorResponseFactory {

    private ErrorResponseFactory() {
    }

    public static ErrorResponse build(
            HttpStatus status,
            String message,
            String path,
            Map<String, String> details
    ) {
        return ErrorResponse.builder()
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(path)
                .details(details == null ? Collections.emptyMap() : details)
                .build();
    }
}
