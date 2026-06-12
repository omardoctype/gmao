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
@ConfigurationProperties(prefix = "app.documents")
public class DocumentStorageProperties {

    @NotBlank
    private String storageDir = "uploads/equipment-documents";

    @Positive
    private long maxFileSizeBytes = 10485760;
}
