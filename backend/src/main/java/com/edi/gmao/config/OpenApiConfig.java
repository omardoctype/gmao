package com.edi.gmao.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "GMAO Industrielle API",
                version = "1.0.0",
                description = "API REST Spring Boot pour la gestion de maintenance assistee par ordinateur (GMAO).",
                contact = @Contact(
                        name = "Equipe EDI",
                        email = "support.gmao@edi.local"
                ),
                license = @License(name = "Internal PFE License")
        )
)
@SecurityScheme(
        name = "bearerAuth",
        description = "Authentification JWT. Format attendu: 'Bearer {token}'",
        type = SecuritySchemeType.HTTP,
        in = SecuritySchemeIn.HEADER,
        paramName = "Authorization",
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class OpenApiConfig {

    @Bean
    public OpenAPI gmaoOpenApi() {
        return new OpenAPI();
    }
}
