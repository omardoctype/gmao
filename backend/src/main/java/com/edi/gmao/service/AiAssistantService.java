package com.edi.gmao.service;

import com.edi.gmao.dto.ai.AiAskRequest;
import com.edi.gmao.dto.ai.AiAskResponse;
import com.edi.gmao.dto.ai.AiDiagnosisRequest;
import com.edi.gmao.dto.ai.AiDiagnosisResponse;
import com.edi.gmao.dto.ai.AiHealthResponse;
import com.edi.gmao.exception.ApiException;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Service
public class AiAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AiAssistantService.class);
    private static final long HEALTH_CACHE_TTL_NANOS = TimeUnit.SECONDS.toNanos(15);

    private final RestClient aiRestClient;
    private volatile AiHealthResponse cachedHealth;
    private volatile long cachedHealthExpiresAtNanos;

    public AiAssistantService(@Qualifier("aiRestClient") RestClient aiRestClient) {
        this.aiRestClient = aiRestClient;
    }

    public AiHealthResponse health() {
        long now = System.nanoTime();
        AiHealthResponse health = cachedHealth;
        if (health != null && now < cachedHealthExpiresAtNanos) {
            log.info("AI timing operation=health cacheHit=true totalMs=0");
            return health;
        }

        AiHealthResponse response = executeGet("/health", AiHealthResponse.class, "health");
        cachedHealth = response;
        cachedHealthExpiresAtNanos = System.nanoTime() + HEALTH_CACHE_TTL_NANOS;
        return response;
    }

    public AiAskResponse ask(AiAskRequest request) {
        return executePost("/ai/ask", request, AiAskResponse.class, "ask");
    }

    public AiDiagnosisResponse diagnosis(AiDiagnosisRequest request) {
        return executePost("/ai/diagnosis", request, AiDiagnosisResponse.class, "diagnosis");
    }

    private <T> T executeGet(String uri, Class<T> responseType, String operationName) {
        long totalStartedAt = System.nanoTime();
        long callStartedAt = System.nanoTime();
        long fastApiMs = -1;
        try {
            T response = aiRestClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(responseType);
            fastApiMs = elapsedMs(callStartedAt);
            T validatedResponse = validateBody(response, operationName);
            logAiTiming(operationName, elapsedMs(totalStartedAt, callStartedAt), fastApiMs, elapsedMs(totalStartedAt), "success");
            return validatedResponse;
        } catch (ResourceAccessException ex) {
            logAiTiming(operationName, elapsedMs(totalStartedAt, callStartedAt), fastApiMs, elapsedMs(totalStartedAt), "unavailable");
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, buildUnavailableMessage(operationName));
        } catch (RestClientResponseException ex) {
            fastApiMs = elapsedMs(callStartedAt);
            logAiTiming(operationName, elapsedMs(totalStartedAt, callStartedAt), fastApiMs, elapsedMs(totalStartedAt), "upstream_error_" + ex.getStatusCode().value());
            throw mapUpstreamResponseError(ex, operationName);
        } catch (RestClientException ex) {
            logAiTiming(operationName, elapsedMs(totalStartedAt, callStartedAt), fastApiMs, elapsedMs(totalStartedAt), "client_error");
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, buildUnavailableMessage(operationName));
        }
    }

    private <T> T executePost(String uri, Object request, Class<T> responseType, String operationName) {
        long totalStartedAt = System.nanoTime();
        long callStartedAt = System.nanoTime();
        long fastApiMs = -1;
        try {
            T response = aiRestClient.post()
                    .uri(uri)
                    .body(request)
                    .retrieve()
                    .body(responseType);
            fastApiMs = elapsedMs(callStartedAt);
            T validatedResponse = validateBody(response, operationName);
            logAiTiming(operationName, elapsedMs(totalStartedAt, callStartedAt), fastApiMs, elapsedMs(totalStartedAt), "success");
            return validatedResponse;
        } catch (ResourceAccessException ex) {
            logAiTiming(operationName, elapsedMs(totalStartedAt, callStartedAt), fastApiMs, elapsedMs(totalStartedAt), "unavailable");
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, buildUnavailableMessage(operationName));
        } catch (RestClientResponseException ex) {
            fastApiMs = elapsedMs(callStartedAt);
            logAiTiming(operationName, elapsedMs(totalStartedAt, callStartedAt), fastApiMs, elapsedMs(totalStartedAt), "upstream_error_" + ex.getStatusCode().value());
            throw mapUpstreamResponseError(ex, operationName);
        } catch (RestClientException ex) {
            logAiTiming(operationName, elapsedMs(totalStartedAt, callStartedAt), fastApiMs, elapsedMs(totalStartedAt), "client_error");
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, buildUnavailableMessage(operationName));
        }
    }

    private void logAiTiming(String operationName, long preparationMs, long fastApiMs, long totalMs, String status) {
        log.info(
                "AI timing operation={} status={} preparationMs={} fastApiMs={} totalMs={}",
                operationName,
                status,
                preparationMs,
                fastApiMs,
                totalMs
        );
    }

    private long elapsedMs(long startedAtNanos) {
        return elapsedMs(startedAtNanos, System.nanoTime());
    }

    private long elapsedMs(long startedAtNanos, long endedAtNanos) {
        return TimeUnit.NANOSECONDS.toMillis(Math.max(0, endedAtNanos - startedAtNanos));
    }

    private <T> T validateBody(T response, String operationName) {
        if (response == null) {
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "AI service returned an empty response for operation: " + operationName
            );
        }
        return response;
    }

    private ApiException mapUpstreamResponseError(RestClientResponseException ex, String operationName) {
        int statusCode = ex.getStatusCode().value();
        String upstreamBody = ex.getResponseBodyAsString();
        if (upstreamBody == null) {
            upstreamBody = "";
        }
        upstreamBody = upstreamBody.trim();

        String message = "AI service error during operation " + operationName + " (status " + statusCode + ")";
        if (!upstreamBody.isBlank()) {
            String compactBody = upstreamBody.replaceAll("\\s+", " ");
            if (compactBody.length() > 300) {
                compactBody = compactBody.substring(0, 300) + "...";
            }
            message = message + ": " + compactBody;
        }

        return new ApiException(HttpStatus.BAD_GATEWAY, message);
    }

    private String buildUnavailableMessage(String operationName) {
        return "AI service is unavailable for operation: " + operationName;
    }
}
