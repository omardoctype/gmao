package com.edi.gmao.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Component
@Validated
@ConfigurationProperties(prefix = "app.ai-service")
public class AiServiceProperties {

    @NotBlank
    private String baseUrl = "http://127.0.0.1:8000";

    @Positive
    private int connectTimeoutMs = 3000;

    @Positive
    private int readTimeoutMs = 120000;
}
