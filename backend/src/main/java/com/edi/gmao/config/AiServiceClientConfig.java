package com.edi.gmao.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class AiServiceClientConfig {

    @Bean(name = "aiRestClient")
    public RestClient aiRestClient(
            RestClient.Builder restClientBuilder,
            AiServiceProperties aiServiceProperties
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(aiServiceProperties.getConnectTimeoutMs());
        requestFactory.setReadTimeout(aiServiceProperties.getReadTimeoutMs());

        return restClientBuilder
                .baseUrl(aiServiceProperties.getBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }
}
