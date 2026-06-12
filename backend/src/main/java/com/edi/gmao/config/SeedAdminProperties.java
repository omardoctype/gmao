package com.edi.gmao.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.seed.admin")
public class SeedAdminProperties {

    private boolean enabled = true;
    private String firstName = "Admin";
    private String lastName = "System";
    private String email = "admin@gmao.com";
    private String password = "Admin123!";
    private boolean active = true;
}
